import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, 
  Upload, 
  Loader2, 
  Apple, 
  ShoppingCart, 
  ChefHat,
  Zap,
  Heart,
  AlertCircle,
  CheckCircle,
  X,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FoodDetectionResult {
  detectedFoods: {
    name: string;
    confidence: number;
    calories: number;
    nutrients: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      vitamins: string[];
    };
  }[];
  totalCalories: number;
  healthScore: number;
  recommendations: string[];
}

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  prepTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  healthBenefits: string[];
  suitableFor: string[];
}

interface GroceryList {
  id: string;
  name: string;
  items: {
    name: string;
    quantity: string;
    category: string;
    purchased: boolean;
  }[];
  createdAt: string;
}

export default function SmartGrocery() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<FoodDetectionResult | null>(null);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [activeTab, setActiveTab] = useState("camera");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Fetch user's health profile for personalized recommendations
  const { data: healthProfile } = useQuery({
    queryKey: ['/api/health-profiles', currentUser?.id],
    enabled: !!currentUser?.id
  });

  // Fetch existing grocery lists
  const { data: userGroceryLists = [], isLoading: groceryListsLoading } = useQuery({
    queryKey: ['/api/grocery-lists', currentUser?.id],
    enabled: !!currentUser?.id
  });

  // Image upload and food detection mutation
  const detectFoodMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('userId', currentUser?.id || '');
      
      // Get the authorization token
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/ai/detect-food', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      return response.json();
    },
    onSuccess: (result: FoodDetectionResult) => {
      setDetectionResult(result);
      toast({
        title: "Food Analysis Complete!",
        description: `Detected ${result.detectedFoods.length} food items with ${result.totalCalories} total calories.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Please try again with a clearer image.",
        variant: "destructive",
      });
    },
  });

  // Generate meal suggestions mutation
  const generateMealsMutation = useMutation({
    mutationFn: async (detectedFoods: string[]) => {
      const response = await apiRequest('POST', '/api/ai/suggest-meals', {
        detectedFoods,
        userId: currentUser?.id,
        healthProfile: healthProfile
      });
      return response.json();
    },
    onSuccess: (suggestions: MealSuggestion[]) => {
      setMealSuggestions(suggestions);
      setActiveTab("meals");
      toast({
        title: "Meal Suggestions Ready!",
        description: `Generated ${suggestions.length} personalized meal ideas for you.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Meals",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create grocery list mutation
  const createGroceryListMutation = useMutation({
    mutationFn: async (listData: { name: string; items: any[] }) => {
      const response = await apiRequest('POST', '/api/grocery-lists', {
        ...listData,
        userId: currentUser?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Grocery List Created!",
        description: "Your personalized grocery list is ready.",
      });
      setActiveTab("grocery");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create List",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    detectFoodMutation.mutate(selectedImage);
  };

  const handleGenerateMeals = () => {
    if (!detectionResult) return;
    
    const detectedFoodNames = detectionResult.detectedFoods.map(food => food.name);
    generateMealsMutation.mutate(detectedFoodNames);
  };

  const handleCreateGroceryList = (meal: MealSuggestion) => {
    const groceryItems = meal.ingredients.map(ingredient => ({
      name: ingredient,
      quantity: "1 unit", // This could be improved with better parsing
      category: "Fresh Produce", // This could be categorized better
      purchased: false
    }));

    createGroceryListMutation.mutate({
      name: `Grocery List for ${meal.name}`,
      items: groceryItems
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Camera className="h-12 w-12 text-emerald-600 mr-3" />
          <h1 className="text-3xl font-bold text-foreground">Smart Grocery Assistant</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Upload photos of vegetables and ingredients to get AI-powered meal suggestions and personalized grocery lists.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Food Scanner
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Meal Ideas
          </TabsTrigger>
          <TabsTrigger value="grocery" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Grocery Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5 text-emerald-600" />
                Upload Food Image
              </CardTitle>
              <CardDescription>
                Take or upload a photo of vegetables, fruits, or ingredients to get instant analysis and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Selected food" 
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={handleAnalyzeImage}
                          disabled={detectFoodMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {detectFoodMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Analyze Food
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                            setDetectionResult(null);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Upload an image of your vegetables or ingredients
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supported formats: JPG, PNG, WEBP (Max 5MB)
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </div>

              {detectionResult && (
                <Card className="bg-emerald-50 dark:bg-emerald-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Calories</p>
                        <p className="text-2xl font-bold text-emerald-600">{detectionResult.totalCalories}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Health Score</p>
                        <p className="text-2xl font-bold text-emerald-600">{detectionResult.healthScore}/10</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Items Found</p>
                        <p className="text-2xl font-bold text-emerald-600">{detectionResult.detectedFoods.length}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Detected Foods:</h4>
                      <div className="flex flex-wrap gap-2">
                        {detectionResult.detectedFoods.map((food, index) => (
                          <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800">
                            {food.name} ({food.calories} cal)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {detectionResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Personalized Recommendations:</h4>
                        <ul className="space-y-1">
                          {detectionResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Heart className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerateMeals}
                      disabled={generateMealsMutation.isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {generateMealsMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating Meals...
                        </>
                      ) : (
                        <>
                          <ChefHat className="h-4 w-4 mr-2" />
                          Get Meal Suggestions
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals" className="space-y-6">
          {mealSuggestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <ChefHat className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Meal Suggestions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload and analyze food images to get personalized meal recommendations.
                </p>
                <Button onClick={() => setActiveTab("camera")}>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Food Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {mealSuggestions.map((meal, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ChefHat className="h-5 w-5 text-orange-600" />
                          {meal.name}
                        </CardTitle>
                        <CardDescription className="mt-2">{meal.description}</CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <Badge className={getDifficultyColor(meal.difficulty)}>
                          {meal.difficulty}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{meal.prepTime} min</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Ingredients:</h4>
                        <ul className="space-y-1 text-sm">
                          {meal.ingredients.map((ingredient, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Plus className="h-3 w-3 text-emerald-600" />
                              {ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Health Benefits:</h4>
                        <ul className="space-y-1 text-sm">
                          {meal.healthBenefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Heart className="h-3 w-3 text-red-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {meal.suitableFor.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Suitable For:</h4>
                        <div className="flex flex-wrap gap-2">
                          {meal.suitableFor.map((diet, i) => (
                            <Badge key={i} variant="outline">{diet}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>🔥 {meal.calories} calories</span>
                        <span>⏱️ {meal.prepTime} minutes</span>
                      </div>
                      <Button 
                        onClick={() => handleCreateGroceryList(meal)}
                        disabled={createGroceryListMutation.isPending}
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Create Grocery List
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grocery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Your Grocery Lists
              </CardTitle>
              <CardDescription>
                Manage your personalized grocery lists based on meal suggestions and health goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groceryListsLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : groceryLists.length === 0 ? (
                <div className="text-center p-8">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Grocery Lists Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create grocery lists from meal suggestions or start from scratch.
                  </p>
                  <Button onClick={() => setActiveTab("meals")}>
                    <ChefHat className="h-4 w-4 mr-2" />
                    Browse Meal Ideas
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {groceryLists.map((list) => (
                    <Card key={list.id} className="border border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        <CardDescription>
                          Created {new Date(list.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {list.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={item.purchased}
                                    className="rounded"
                                    readOnly
                                  />
                                  <span className={item.purchased ? 'line-through text-muted-foreground' : ''}>
                                    {item.name}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {item.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Health Profile Alert */}
      {!healthProfile && (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your health profile to get more personalized meal suggestions and grocery recommendations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}