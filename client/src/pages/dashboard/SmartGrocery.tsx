import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  Plus,
  Star,
  Clock,
  Target,
  TrendingUp
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

interface GroceryListSuggestion {
  weeklyBudget: number;
  totalItems: number;
  categories: {
    name: string;
    items: {
      name: string;
      quantity: string;
      estimatedCost: number;
      healthBenefits: string[];
      priority: 'high' | 'medium' | 'low';
    }[];
  }[];
  healthScore: number;
  budgetTips: string[];
  nutritionalBalance: {
    proteins: number;
    vegetables: number;
    fruits: number;
    grains: number;
    dairy: number;
  };
  mealPrepTips: string[];
}

export default function SmartGrocery() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<FoodDetectionResult | null>(null);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [groceryListSuggestion, setGroceryListSuggestion] = useState<GroceryListSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState("scanner");
  
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

  // Food detection mutation
  const detectFoodMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('userId', currentUser?.id || '');
      
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

  // Generate grocery list suggestion mutation
  const generateGroceryListMutation = useMutation({
    mutationFn: async (mealPlans?: string[]) => {
      const response = await apiRequest('POST', '/api/ai/generate-grocery-list', {
        mealPlans: mealPlans || [],
        userId: currentUser?.id
      });
      return response.json();
    },
    onSuccess: (suggestion: GroceryListSuggestion) => {
      setGroceryListSuggestion(suggestion);
      setActiveTab("grocery");
      toast({
        title: "Grocery List Generated!",
        description: `Created a personalized grocery list with ${suggestion.totalItems} items.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Grocery List",
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
        description: "Your personalized grocery list has been saved.",
      });
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

  const handleGenerateGroceryList = (selectedMeals?: string[]) => {
    generateGroceryListMutation.mutate(selectedMeals);
  };

  const handleCreateGroceryListFromSuggestion = () => {
    if (!groceryListSuggestion) return;
    
    const groceryItems = groceryListSuggestion.categories.flatMap(category =>
      category.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        category: category.name,
        purchased: false
      }))
    );

    createGroceryListMutation.mutate({
      name: `Weekly Grocery List - ${new Date().toLocaleDateString()}`,
      items: groceryItems
    });
  };

  const handleCreateGroceryListFromMeal = (meal: MealSuggestion) => {
    const groceryItems = meal.ingredients.map(ingredient => ({
      name: ingredient,
      quantity: "1 unit",
      category: "Ingredients",
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
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
          Scan food, get meal ideas, and create personalized grocery lists with AI-powered assistance.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner" className="flex items-center gap-2">
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

        {/* Food Scanner Tab */}
        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5 text-emerald-600" />
                Food Scanner
              </CardTitle>
              <CardDescription>
                Upload photos of food to get detailed nutritional analysis and calorie information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Selected food"
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                          setDetectionResult(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={handleAnalyzeImage}
                        disabled={detectFoodMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {detectFoodMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Different Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Upload Food Image
                    </p>
                    <p className="text-gray-500 mb-4">
                      Take a photo or upload an image of food items for AI analysis
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select Image
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Detection Results */}
              {detectionResult && (
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-emerald-700">
                        {detectionResult.detectedFoods.length} Foods Detected
                      </Badge>
                      <Badge variant="outline" className="text-emerald-700">
                        {detectionResult.totalCalories} Calories
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">
                          Health Score: {detectionResult.healthScore}/10
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      {detectionResult.detectedFoods.map((food, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{food.name}</h4>
                            <Badge variant="outline">
                              {Math.round(food.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Calories:</span>
                              <span className="ml-1 font-medium">{food.calories}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Protein:</span>
                              <span className="ml-1 font-medium">{food.nutrients.protein}g</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Carbs:</span>
                              <span className="ml-1 font-medium">{food.nutrients.carbs}g</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fiber:</span>
                              <span className="ml-1 font-medium">{food.nutrients.fiber}g</span>
                            </div>
                          </div>
                          {food.nutrients.vitamins.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-500 text-sm">Key Vitamins: </span>
                              {food.nutrients.vitamins.map((vitamin, i) => (
                                <Badge key={i} variant="secondary" className="mr-1 text-xs">
                                  {vitamin}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {detectionResult.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">AI Recommendations:</h4>
                        <ul className="space-y-1">
                          {detectionResult.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleGenerateMeals}
                        disabled={generateMealsMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {generateMealsMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ChefHat className="h-4 w-4 mr-2" />
                            Get Meal Ideas
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meal Ideas Tab */}
        <TabsContent value="meals" className="space-y-6">
          {mealSuggestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ChefHat className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Meal Ideas Yet</h3>
                <p className="text-gray-500 text-center mb-6">
                  Upload and analyze food images first, or generate meal ideas based on your health profile.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setActiveTab("scanner")}
                    variant="outline"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Food First
                  </Button>
                  <Button
                    onClick={() => handleGenerateGroceryList()}
                    disabled={generateGroceryListMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {generateGroceryListMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ChefHat className="h-4 w-4 mr-2" />
                        Generate Ideas
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {mealSuggestions.map((meal, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{meal.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {meal.description}
                        </CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(meal.difficulty)}>
                        {meal.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meal.prepTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {meal.calories} cal
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Ingredients:</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {meal.ingredients.slice(0, 5).map((ingredient, i) => (
                          <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                            <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                            {ingredient}
                          </div>
                        ))}
                        {meal.ingredients.length > 5 && (
                          <div className="text-sm text-gray-500">
                            +{meal.ingredients.length - 5} more ingredients
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Health Benefits:</h4>
                      <div className="flex flex-wrap gap-1">
                        {meal.healthBenefits.slice(0, 3).map((benefit, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Suitable For:</h4>
                      <div className="flex flex-wrap gap-1">
                        {meal.suitableFor.map((diet, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {diet}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateGroceryListFromMeal(meal)}
                        disabled={createGroceryListMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Create List
                      </Button>
                      <Button size="sm" variant="outline">
                        <Star className="h-3 w-3 mr-1" />
                        Save Recipe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Grocery Lists Tab */}
        <TabsContent value="grocery" className="space-y-6">
          {/* AI Grocery List Suggestion */}
          {groceryListSuggestion ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  AI Generated Grocery List
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {groceryListSuggestion.totalItems} Items
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">
                      Health Score: {groceryListSuggestion.healthScore}/10
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nutritional Balance */}
                <div>
                  <h4 className="font-medium mb-3">Nutritional Balance</h4>
                  <div className="space-y-2">
                    {Object.entries(groceryListSuggestion.nutritionalBalance).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-20 text-sm capitalize">{key}:</span>
                        <Progress value={value} className="flex-1" />
                        <span className="text-sm font-medium w-8">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Grocery Categories */}
                <div className="space-y-4">
                  {groceryListSuggestion.categories.map((category, index) => (
                    <div key={index}>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {category.name}
                      </h4>
                      <div className="grid gap-2">
                        {category.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                <Badge className={getPriorityColor(item.priority)} variant="secondary">
                                  {item.priority}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                Quantity: {item.quantity}
                              </div>
                              {item.healthBenefits.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Benefits: {item.healthBenefits.slice(0, 2).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Tips */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Budget Tips:</h4>
                    <ul className="space-y-1">
                      {groceryListSuggestion.budgetTips.map((tip, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <Heart className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Meal Prep Tips:</h4>
                    <ul className="space-y-1">
                      {groceryListSuggestion.mealPrepTips.map((tip, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChefHat className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleCreateGroceryListFromSuggestion}
                  disabled={createGroceryListMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {createGroceryListMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating List...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Save This Grocery List
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Generate Smart Grocery List</h3>
                <p className="text-gray-500 text-center mb-6">
                  Get AI-powered grocery recommendations based on your health profile and meal plans.
                </p>
                <Button
                  onClick={() => handleGenerateGroceryList()}
                  disabled={generateGroceryListMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {generateGroceryListMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Generate Smart List
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Grocery Lists */}
          <Card>
            <CardHeader>
              <CardTitle>Your Grocery Lists</CardTitle>
              <CardDescription>
                Previously created and saved grocery lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groceryListsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading your lists...</span>
                </div>
              ) : (userGroceryLists as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No grocery lists created yet. Generate your first smart list above!
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {(userGroceryLists as any[]).map((list: any) => (
                      <Card key={list.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{list.name}</h4>
                          <Badge variant="outline">
                            {Array.isArray(list.items) ? list.items.length : JSON.parse(list.items || '[]').length} items
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Created: {new Date(list.createdAt).toLocaleDateString()}
                        </p>
                        <div className="space-y-1">
                          {(Array.isArray(list.items) ? list.items : JSON.parse(list.items || '[]')).slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                              {item.name} - {item.quantity}
                            </div>
                          ))}
                          {(Array.isArray(list.items) ? list.items : JSON.parse(list.items || '[]')).length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{(Array.isArray(list.items) ? list.items : JSON.parse(list.items || '[]')).length - 3} more items
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
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
            Complete your health profile to get more personalized nutrition recommendations and meal suggestions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}