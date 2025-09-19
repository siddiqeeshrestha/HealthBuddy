import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Apple, 
  Activity, 
  Scale, 
  Brain, 
  Plus, 
  Calendar,
  Clock,
  TrendingUp,
  Droplets,
  Moon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form schemas
const calorieFormSchema = z.object({
  value: z.coerce.number().positive('Calories must be positive'),
  foodItem: z.string().min(1, 'Food item is required'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  notes: z.string().optional(),
});

const exerciseFormSchema = z.object({
  exerciseType: z.string().min(1, 'Exercise type is required'),
  duration: z.coerce.number().positive('Duration must be positive').optional(),
  intensity: z.enum(['low', 'moderate', 'high']).optional(),
  caloriesBurned: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

const weightFormSchema = z.object({
  value: z.coerce.number().positive('Weight must be positive'),
  unit: z.enum(['kg', 'lbs']),
  notes: z.string().optional(),
});

const waterFormSchema = z.object({
  value: z.coerce.number().positive('Water intake must be positive'),
  unit: z.enum(['ml', 'liters', 'cups']),
  notes: z.string().optional(),
});

const sleepFormSchema = z.object({
  value: z.coerce.number().min(0).max(24, 'Sleep duration cannot exceed 24 hours'),
  bedtime: z.string().optional(),
  wakeupTime: z.string().optional(),
  quality: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const mentalWellnessFormSchema = z.object({
  moodRating: z.coerce.number().min(1).max(10),
  stressLevel: z.coerce.number().min(1).max(10),
  anxietyLevel: z.coerce.number().min(1).max(10),
  sleepQuality: z.coerce.number().min(1).max(10),
  energyLevel: z.coerce.number().min(1).max(10),
  activities: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type CalorieFormData = z.infer<typeof calorieFormSchema>;
type ExerciseFormData = z.infer<typeof exerciseFormSchema>;
type WeightFormData = z.infer<typeof weightFormSchema>;
type WaterFormData = z.infer<typeof waterFormSchema>;
type SleepFormData = z.infer<typeof sleepFormSchema>;
type MentalWellnessFormData = z.infer<typeof mentalWellnessFormSchema>;

export default function DailyTracking() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's tracking entries
  const { data: todayEntries, isLoading } = useQuery({
    queryKey: ['/api/tracking/today', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Form instances
  const calorieForm = useForm<CalorieFormData>({
    resolver: zodResolver(calorieFormSchema),
    defaultValues: {
      value: 0,
      foodItem: '',
      mealType: 'breakfast',
      notes: '',
    },
  });

  const exerciseForm = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      exerciseType: '',
      duration: 0,
      intensity: 'moderate',
      caloriesBurned: 0,
      notes: '',
    },
  });

  const weightForm = useForm<WeightFormData>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      value: 0,
      unit: 'kg',
      notes: '',
    },
  });

  const waterForm = useForm<WaterFormData>({
    resolver: zodResolver(waterFormSchema),
    defaultValues: {
      value: 0,
      unit: 'ml',
      notes: '',
    },
  });

  const sleepForm = useForm<SleepFormData>({
    resolver: zodResolver(sleepFormSchema),
    defaultValues: {
      value: 0,
      bedtime: '',
      wakeupTime: '',
      quality: 5,
      notes: '',
    },
  });

  const mentalWellnessForm = useForm<MentalWellnessFormData>({
    resolver: zodResolver(mentalWellnessFormSchema),
    defaultValues: {
      moodRating: 5,
      stressLevel: 5,
      anxietyLevel: 5,
      sleepQuality: 5,
      energyLevel: 5,
      activities: [],
      notes: '',
    },
  });

  // Mutations for different tracking types
  const createCalorieEntry = useMutation({
    mutationFn: async (data: CalorieFormData) => {
      return apiRequest('POST', '/api/tracking/calories', {
        ...data,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking/today', currentUser?.id] });
      calorieForm.reset();
      toast({ title: 'Success!', description: 'Calorie entry added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add calorie entry.', variant: 'destructive' });
    },
  });

  const createExerciseEntry = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      return apiRequest('POST', '/api/tracking/exercise', {
        ...data,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking/today', currentUser?.id] });
      exerciseForm.reset();
      toast({ title: 'Success!', description: 'Exercise entry added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add exercise entry.', variant: 'destructive' });
    },
  });

  const createWeightEntry = useMutation({
    mutationFn: async (data: WeightFormData) => {
      return apiRequest('POST', '/api/tracking/weight', {
        ...data,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking/today', currentUser?.id] });
      weightForm.reset();
      toast({ title: 'Success!', description: 'Weight entry added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add weight entry.', variant: 'destructive' });
    },
  });

  const createWaterEntry = useMutation({
    mutationFn: async (data: WaterFormData) => {
      return apiRequest('POST', '/api/tracking/water', {
        ...data,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking/today', currentUser?.id] });
      waterForm.reset();
      toast({ title: 'Success!', description: 'Water intake added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add water entry.', variant: 'destructive' });
    },
  });

  const createSleepEntry = useMutation({
    mutationFn: async (data: SleepFormData) => {
      return apiRequest('POST', '/api/tracking/sleep', {
        ...data,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking/today', currentUser?.id] });
      sleepForm.reset();
      toast({ title: 'Success!', description: 'Sleep entry added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add sleep entry.', variant: 'destructive' });
    },
  });

  const createMentalWellnessEntry = useMutation({
    mutationFn: async (data: MentalWellnessFormData) => {
      return apiRequest('POST', '/api/mental-wellness', {
        ...data,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking/today', currentUser?.id] });
      mentalWellnessForm.reset();
      toast({ title: 'Success!', description: 'Mental wellness entry added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add mental wellness entry.', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading your tracking data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Daily Tracking</h1>
        </div>
        <p className="text-muted-foreground">Track your daily health activities and wellness metrics.</p>
        <p className="text-sm text-muted-foreground mt-1">Today: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-xl font-bold">1,847</p>
              </div>
              <Apple className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exercise</p>
                <p className="text-xl font-bold">45 min</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Water</p>
                <p className="text-xl font-bold">1.5L</p>
              </div>
              <Droplets className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sleep</p>
                <p className="text-xl font-bold">7.5h</p>
              </div>
              <Moon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Forms */}
      <Tabs defaultValue="calories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="calories" data-testid="tab-calories">
            <Apple className="w-4 h-4 mr-2" />
            Calories
          </TabsTrigger>
          <TabsTrigger value="exercise" data-testid="tab-exercise">
            <Activity className="w-4 h-4 mr-2" />
            Exercise
          </TabsTrigger>
          <TabsTrigger value="weight" data-testid="tab-weight">
            <Scale className="w-4 h-4 mr-2" />
            Weight
          </TabsTrigger>
          <TabsTrigger value="water" data-testid="tab-water">
            <Droplets className="w-4 h-4 mr-2" />
            Water
          </TabsTrigger>
          <TabsTrigger value="sleep" data-testid="tab-sleep">
            <Moon className="w-4 h-4 mr-2" />
            Sleep
          </TabsTrigger>
          <TabsTrigger value="wellness" data-testid="tab-wellness">
            <Brain className="w-4 h-4 mr-2" />
            Wellness
          </TabsTrigger>
        </TabsList>

        {/* Calorie Tracking */}
        <TabsContent value="calories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-orange-500" />
                Log Calorie Intake
              </CardTitle>
              <CardDescription>Track your daily calorie consumption by meal</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...calorieForm}>
                <form onSubmit={calorieForm.handleSubmit((data) => createCalorieEntry.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={calorieForm.control}
                      name="foodItem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Food Item</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-food-item"
                              placeholder="e.g., Grilled chicken breast"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={calorieForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calories</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-calories"
                              type="number"
                              placeholder="300"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={calorieForm.control}
                    name="mealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-meal-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                            <SelectItem value="lunch">☀️ Lunch</SelectItem>
                            <SelectItem value="dinner">🌙 Dinner</SelectItem>
                            <SelectItem value="snack">🍪 Snack</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={calorieForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-calorie-notes"
                            placeholder="Additional details about the meal..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    data-testid="button-add-calories"
                    type="submit"
                    disabled={createCalorieEntry.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createCalorieEntry.isPending ? 'Adding...' : 'Add Calorie Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercise Tracking */}
        <TabsContent value="exercise">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Log Exercise Activity
              </CardTitle>
              <CardDescription>Record your workouts and physical activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...exerciseForm}>
                <form onSubmit={exerciseForm.handleSubmit((data) => createExerciseEntry.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={exerciseForm.control}
                      name="exerciseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercise Type</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-exercise-type"
                              placeholder="e.g., Running, Weight training"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={exerciseForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-exercise-duration"
                              type="number"
                              placeholder="30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={exerciseForm.control}
                      name="intensity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intensity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-exercise-intensity">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">🟢 Low</SelectItem>
                              <SelectItem value="moderate">🟡 Moderate</SelectItem>
                              <SelectItem value="high">🔴 High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={exerciseForm.control}
                      name="caloriesBurned"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calories Burned</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-calories-burned"
                              type="number"
                              placeholder="250"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={exerciseForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-exercise-notes"
                            placeholder="How did the workout feel? Any observations..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    data-testid="button-add-exercise"
                    type="submit"
                    disabled={createExerciseEntry.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createExerciseEntry.isPending ? 'Adding...' : 'Add Exercise Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weight Tracking */}
        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                Log Weight Measurement
              </CardTitle>
              <CardDescription>Track your weight progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...weightForm}>
                <form onSubmit={weightForm.handleSubmit((data) => createWeightEntry.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={weightForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-weight-value"
                              type="number"
                              step="0.1"
                              placeholder="70.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={weightForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-weight-unit">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={weightForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-weight-notes"
                            placeholder="Time of day, conditions, etc..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    data-testid="button-add-weight"
                    type="submit"
                    disabled={createWeightEntry.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createWeightEntry.isPending ? 'Adding...' : 'Add Weight Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Water Tracking */}
        <TabsContent value="water">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Log Water Intake
              </CardTitle>
              <CardDescription>Stay hydrated by tracking your daily water consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...waterForm}>
                <form onSubmit={waterForm.handleSubmit((data) => createWaterEntry.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={waterForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-water-value"
                              type="number"
                              step="0.1"
                              placeholder="500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={waterForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-water-unit">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ml">Milliliters (ml)</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="cups">Cups</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={waterForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-water-notes"
                            placeholder="Type of beverage, timing, etc..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    data-testid="button-add-water"
                    type="submit"
                    disabled={createWaterEntry.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createWaterEntry.isPending ? 'Adding...' : 'Add Water Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sleep Tracking */}
        <TabsContent value="sleep">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-500" />
                Log Sleep Data
              </CardTitle>
              <CardDescription>Track your sleep duration and quality</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sleepForm}>
                <form onSubmit={sleepForm.handleSubmit((data) => createSleepEntry.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={sleepForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-sleep-duration"
                              type="number"
                              step="0.5"
                              placeholder="7.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sleepForm.control}
                      name="bedtime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedtime</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-bedtime"
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sleepForm.control}
                      name="wakeupTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wake up Time</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-wakeup-time"
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={sleepForm.control}
                    name="quality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sleep Quality (1-10)</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-sleep-quality"
                            type="number"
                            min="1"
                            max="10"
                            placeholder="7"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sleepForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-sleep-notes"
                            placeholder="How did you sleep? Any disruptions..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    data-testid="button-add-sleep"
                    type="submit"
                    disabled={createSleepEntry.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createSleepEntry.isPending ? 'Adding...' : 'Add Sleep Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mental Wellness Tracking */}
        <TabsContent value="wellness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Log Mental Wellness
              </CardTitle>
              <CardDescription>Track your mood, stress levels, and mental well-being</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...mentalWellnessForm}>
                <form onSubmit={mentalWellnessForm.handleSubmit((data) => createMentalWellnessEntry.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={mentalWellnessForm.control}
                      name="moodRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mood Rating (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-mood-rating"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="7"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={mentalWellnessForm.control}
                      name="stressLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stress Level (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-stress-level"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={mentalWellnessForm.control}
                      name="anxietyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anxiety Level (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-anxiety-level"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="4"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={mentalWellnessForm.control}
                      name="energyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Energy Level (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-energy-level"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="6"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={mentalWellnessForm.control}
                      name="sleepQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sleep Quality (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-sleep-quality-wellness"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="7"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={mentalWellnessForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-wellness-notes"
                            placeholder="How are you feeling today? Any thoughts or observations..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    data-testid="button-add-wellness"
                    type="submit"
                    disabled={createMentalWellnessEntry.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createMentalWellnessEntry.isPending ? 'Adding...' : 'Add Wellness Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}