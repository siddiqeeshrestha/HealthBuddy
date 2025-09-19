import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Target, Calendar, CheckCircle, X, Trophy, Clock, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const healthPlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  goalType: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'mental_health'], {
    required_error: 'Goal type is required',
  }),
  targetValue: z.string().optional(),
  targetUnit: z.string().optional(),
  duration: z.coerce.number().min(1).optional(),
});

const targetSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetType: z.enum(['daily', 'weekly', 'total'], {
    required_error: 'Target type is required',
  }),
  targetValue: z.coerce.number().min(0.1, 'Target value must be positive'),
  targetUnit: z.string().min(1, 'Unit is required'),
  dueDate: z.string().optional(),
});

type HealthPlanFormData = z.infer<typeof healthPlanSchema>;
type TargetFormData = z.infer<typeof targetSchema>;

const goalTypeLabels = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  general_fitness: 'General Fitness',
  mental_health: 'Mental Health'
};

const goalTypeIcons = {
  weight_loss: '🎯',
  muscle_gain: '💪',
  general_fitness: '🏃',
  mental_health: '🧠'
};

export default function HealthPlans() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const form = useForm<HealthPlanFormData>({
    resolver: zodResolver(healthPlanSchema),
    defaultValues: {
      title: '',
      description: '',
      goalType: 'general_fitness',
      targetValue: '',
      targetUnit: '',
      duration: undefined,
    },
  });

  const targetForm = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      title: '',
      description: '',
      targetType: 'weekly',
      targetValue: 0,
      targetUnit: '',
      dueDate: '',
    },
  });

  // Fetch user's health plans
  const { data: healthPlans, isLoading } = useQuery({
    queryKey: ['/api/health-plans', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Create health plan mutation
  const createHealthPlan = useMutation({
    mutationFn: async (data: HealthPlanFormData) => {
      return apiRequest('POST', '/api/health-plans', {
        ...data,
        targetValue: data.targetValue || null,
        targetUnit: data.targetUnit || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health-plans', currentUser?.id] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: 'Success!',
        description: 'Health plan created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create health plan. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete health plan mutation
  const deleteHealthPlan = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('DELETE', `/api/health-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health-plans', currentUser?.id] });
      toast({
        title: 'Success!',
        description: 'Health plan deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete health plan. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Health plan targets mutations
  const createTarget = useMutation({
    mutationFn: async (targetData: TargetFormData & { planId: string }) => {
      return apiRequest('POST', '/api/health-plan-targets', targetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health-plans', currentUser?.id] });
      targetForm.reset();
      setTargetDialogOpen(false);
      setSelectedPlanId(null);
      toast({
        title: 'Success!',
        description: 'Target added successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add target. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: HealthPlanFormData) => {
    createHealthPlan.mutate(values);
  };

  const onTargetSubmit = (values: TargetFormData) => {
    if (!selectedPlanId) return;
    createTarget.mutate({ ...values, planId: selectedPlanId });
  };

  const togglePlanExpansion = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const openTargetDialog = (planId: string) => {
    setSelectedPlanId(planId);
    setTargetDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading your health plans...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Plans</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage personalized health and fitness plans to reach your goals.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-plan" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Health Plan</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Title</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-plan-title"
                          placeholder="e.g., Summer Fitness Challenge"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-goal-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(goalTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {goalTypeIcons[value as keyof typeof goalTypeIcons]} {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="textarea-plan-description"
                          placeholder="Describe your health plan and goals..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Value</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-target-value"
                            placeholder="e.g., 10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-target-unit"
                            placeholder="e.g., kg, lbs, days"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Days)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-duration"
                          type="number"
                          min="1"
                          placeholder="e.g., 30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid="button-submit-plan"
                  type="submit"
                  className="w-full"
                  disabled={createHealthPlan.isPending}
                >
                  {createHealthPlan.isPending ? 'Creating...' : 'Create Health Plan'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Target Dialog */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Target</DialogTitle>
          </DialogHeader>
          <Form {...targetForm}>
            <form onSubmit={targetForm.handleSubmit(onTargetSubmit)} className="space-y-6">
              <FormField
                control={targetForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Weekly Exercise Goal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={targetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this target..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={targetForm.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="total">Total</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={targetForm.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={targetForm.control}
                  name="targetUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., workouts, kg, hours"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={targetForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createTarget.isPending}
              >
                {createTarget.isPending ? 'Adding...' : 'Add Target'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Health Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthPlans && Array.isArray(healthPlans) && healthPlans.length > 0 ? (
          healthPlans.map((plan: any) => (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                plan.isActive ? 'border-primary' : 'border-muted'
              }`}
              data-testid={`plan-card-${plan.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {goalTypeIcons[plan.goalType as keyof typeof goalTypeIcons] || '🎯'}
                    </span>
                    <div>
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <CardDescription>
                        {goalTypeLabels[plan.goalType as keyof typeof goalTypeLabels]}
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHealthPlan.mutate(plan.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    data-testid={`button-delete-${plan.id}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {plan.targetValue && (
                    <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      <Target className="w-3 h-3" />
                      {plan.targetValue} {plan.targetUnit}
                    </div>
                  )}
                  {plan.duration && (
                    <div className="flex items-center gap-1 text-sm bg-accent text-accent-foreground px-2 py-1 rounded">
                      <Calendar className="w-3 h-3" />
                      {plan.duration} days
                    </div>
                  )}
                  {plan.isActive && (
                    <div className="flex items-center gap-1 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </div>
                  )}
                </div>

                {/* Targets Section */}
                <Collapsible 
                  open={expandedPlans.has(plan.id)} 
                  onOpenChange={() => togglePlanExpansion(plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 p-0 h-auto font-medium">
                        <Trophy className="w-4 h-4" />
                        Targets
                        <BarChart3 className={`w-4 h-4 transition-transform ${expandedPlans.has(plan.id) ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTargetDialog(plan.id)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Target
                    </Button>
                  </div>
                  
                  <CollapsibleContent className="space-y-2 mt-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      Set specific targets to track your progress towards this health plan.
                    </div>
                    
                    {/* This would show actual targets - for now showing placeholder */}
                    <div className="space-y-2">
                      <div className="p-2 bg-muted/30 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Weekly Exercise</span>
                          <span className="text-muted-foreground">3/5 workouts</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      
                      <div className="p-2 bg-muted/30 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Daily Steps</span>
                          <span className="text-muted-foreground">8,500/10,000</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(plan.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Health Plans Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first personalized health plan to start tracking your fitness goals.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-first-plan">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}