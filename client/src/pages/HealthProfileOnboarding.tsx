import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Activity, User, Target, Utensils, AlertTriangle, Plus, X } from "lucide-react";
import { onboardingHealthProfileSchema, type OnboardingHealthProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HealthProfileOnboardingProps {
  onComplete: () => void;
}

export default function HealthProfileOnboarding({ onComplete }: HealthProfileOnboardingProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [customMedicalCondition, setCustomMedicalCondition] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [customMedication, setCustomMedication] = useState("");

  const form = useForm<OnboardingHealthProfile>({
    resolver: zodResolver(onboardingHealthProfileSchema),
    defaultValues: {
      userId: currentUser?.id || "",
      gender: undefined,
      age: "" as any, // Initialize as empty string to prevent uncontrolled input warnings
      height: "" as any,
      weight: "" as any,
      goalWeight: "" as any,
      activityLevel: undefined,
      healthGoals: [],
      medicalConditions: [],
      allergies: [],
      medications: [],
      dietaryPreferences: [],
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: OnboardingHealthProfile) => {
      const response = await apiRequest('POST', '/api/health-profile/onboarding', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile created successfully!",
        description: "Your health profile has been set up. Let's start your health journey!",
      });
      onComplete();
    },
    onError: (error) => {
      console.error('Profile creation error:', error);
      toast({
        title: "Setup failed",
        description: "Failed to create your health profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const fitnessGoalOptions = [
    { value: 'weight_loss', label: 'Weight Loss', icon: Target },
    { value: 'muscle_gain', label: 'Muscle Gain', icon: Activity },
    { value: 'general_fitness', label: 'General Fitness', icon: Heart },
    { value: 'endurance', label: 'Endurance', icon: Activity },
    { value: 'strength', label: 'Strength Training', icon: Activity },
    { value: 'flexibility', label: 'Flexibility', icon: Activity },
    { value: 'stress_relief', label: 'Stress Relief', icon: Heart },
  ];

  const dietaryOptions = [
    { value: 'none', label: 'No specific diet' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Ketogenic' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'gluten_free', label: 'Gluten-Free' },
    { value: 'dairy_free', label: 'Dairy-Free' },
    { value: 'low_carb', label: 'Low Carb' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'intermittent_fasting', label: 'Intermittent Fasting' },
  ];

  const addCustomItem = (field: 'medicalConditions' | 'allergies' | 'medications', value: string, setValue: (value: string) => void) => {
    if (value.trim()) {
      const currentValues = form.getValues(field) || [];
      if (!currentValues.includes(value.trim())) {
        form.setValue(field, [...currentValues, value.trim()]);
        setValue("");
      }
    }
  };

  const removeItem = (field: 'medicalConditions' | 'allergies' | 'medications', index: number) => {
    const currentValues = form.getValues(field) || [];
    form.setValue(field, currentValues.filter((_, i) => i !== index));
  };

  const onSubmit = (data: OnboardingHealthProfile) => {
    createProfileMutation.mutate(data);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6" data-testid="step-basic-info">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Let's start with some basic details about you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-gender">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter your age" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter height in cm" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-height"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="Enter current weight" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="goalWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Weight (kg) - Optional</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="Enter your goal weight" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      data-testid="input-goal-weight"
                    />
                  </FormControl>
                  <FormDescription>Leave blank if you don't have a specific weight goal</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6" data-testid="step-activity-goals">
            <div className="text-center mb-6">
              <Activity className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity & Goals</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us about your activity level and fitness goals</p>
            </div>

            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-activity-level">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your activity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                      <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                      <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                      <SelectItem value="very_active">Very Active (very hard exercise, physical job)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="healthGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fitness Goals (Select all that apply)</FormLabel>
                  <FormDescription>Choose your primary fitness objectives</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {fitnessGoalOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div
                          key={option.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            Array.isArray(field.value) && field.value.includes(option.value as any)
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const currentGoals = Array.isArray(field.value) ? field.value : [];
                            if (currentGoals.includes(option.value as any)) {
                              field.onChange(currentGoals.filter((goal) => goal !== option.value));
                            } else {
                              field.onChange([...currentGoals, option.value]);
                            }
                          }}
                          data-testid={`goal-${option.value}`}
                        >
                          <Icon className="h-6 w-6 mb-2 mx-auto text-teal-600" />
                          <p className="text-sm font-medium text-center">{option.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6" data-testid="step-health-info">
            <div className="text-center mb-6">
              <Heart className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Health Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Help us understand your health background</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Medical Conditions */}
              <FormField
                control={form.control}
                name="medicalConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Conditions</FormLabel>
                    <FormDescription>Add any medical conditions you have</FormDescription>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter condition"
                          value={customMedicalCondition}
                          onChange={(e) => setCustomMedicalCondition(e.target.value)}
                          data-testid="input-medical-condition"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addCustomItem('medicalConditions', customMedicalCondition, setCustomMedicalCondition)}
                          data-testid="button-add-medical-condition"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {condition}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeItem('medicalConditions', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Allergies */}
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <FormDescription>Add any allergies you have</FormDescription>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter allergy"
                          value={customAllergy}
                          onChange={(e) => setCustomAllergy(e.target.value)}
                          data-testid="input-allergy"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addCustomItem('allergies', customAllergy, setCustomAllergy)}
                          data-testid="button-add-allergy"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((allergy, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {allergy}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeItem('allergies', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medications */}
              <FormField
                control={form.control}
                name="medications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Medications</FormLabel>
                    <FormDescription>Add any medications you're taking</FormDescription>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter medication"
                          value={customMedication}
                          onChange={(e) => setCustomMedication(e.target.value)}
                          data-testid="input-medication"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addCustomItem('medications', customMedication, setCustomMedication)}
                          data-testid="button-add-medication"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((medication, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {medication}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeItem('medications', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6" data-testid="step-dietary-preferences">
            <div className="text-center mb-6">
              <Utensils className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dietary Preferences</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us about your dietary preferences and restrictions</p>
            </div>

            <FormField
              control={form.control}
              name="dietaryPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Preferences (Select all that apply)</FormLabel>
                  <FormDescription>Choose your dietary preferences or restrictions</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {dietaryOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          Array.isArray(field.value) && field.value.includes(option.value as any)
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const currentPrefs = Array.isArray(field.value) ? field.value : [];
                          if (currentPrefs.includes(option.value as any)) {
                            field.onChange(currentPrefs.filter((pref) => pref !== option.value));
                          } else {
                            field.onChange([...currentPrefs, option.value]);
                          }
                        }}
                        data-testid={`dietary-${option.value}`}
                      >
                        <p className="text-sm font-medium text-center">{option.label}</p>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to HealthBuddy! 🌟
            </CardTitle>
            <CardDescription className="text-lg">
              Let's set up your personalized health profile to provide you with the best recommendations
            </CardDescription>
            
            {/* Progress indicator */}
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step <= currentStep
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    data-testid={`step-indicator-${step}`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Step {currentStep} of 4
            </p>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderStep()}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createProfileMutation.isPending}
                      data-testid="button-complete-setup"
                    >
                      {createProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            {/* Privacy notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Privacy & Security:</strong> Your health information is encrypted and stored securely. 
                  We never share your personal health data with third parties. This information helps us provide 
                  personalized health recommendations and improve your experience with HealthBuddy.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}