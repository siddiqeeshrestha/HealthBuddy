import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'wouter';
import { 
  CheckCircle, 
  Home, 
  Target, 
  Activity, 
  Brain, 
  Stethoscope,
  LogOut, 
  User,
  Menu,
  X,
  LucideIcon,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertHealthProfileSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Personalized Plans', href: '/plans', icon: Target },
  { name: 'Daily Tracking', href: '/tracking', icon: Activity },
  { name: 'Symptom Checker', href: '/symptoms', icon: Stethoscope },
  { name: 'Mental Wellness', href: '/wellness', icon: Brain },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/dashboard' || location === '/dashboard/';
    }
    return location.startsWith(`/dashboard${href}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div 
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-card border-r border-border transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <SidebarContent navigation={navigation} isActive={isActive} />
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <SidebarContent navigation={navigation} isActive={isActive} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card border-b border-border">
          <button
            type="button"
            className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <p 
                    className="text-sm font-medium text-foreground"
                    data-testid="text-username"
                  >
                    {currentUser?.displayName || 'User'}
                  </p>
                  <p 
                    className="text-xs text-muted-foreground"
                    data-testid="text-email"
                  >
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, isActive }: { 
  navigation: NavigationItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <>
      <div className="flex items-center flex-shrink-0 px-4">
        <CheckCircle className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-semibold text-foreground">HealthBuddy</span>
      </div>
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <div
              data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon 
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  isActive(item.href) ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              {item.name}
            </div>
          </Link>
        ))}
      </nav>
      
      {/* Profile Button at bottom */}
      <div className="px-2 pb-4">
        <Separator className="mb-4" />
        <ProfileDialog />
      </div>
    </>
  );
}

function ProfileDialog() {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { currentUser } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/health-profiles', currentUser?.id],
    enabled: open && !!currentUser?.id
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
          data-testid="button-profile"
        >
          <Settings className="mr-3 h-6 w-6" />
          Health Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Health Profile
          </DialogTitle>
          <DialogDescription>
            View and manage your health profile information.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ) : profile ? (
            editMode ? (
              <EditProfileForm profile={profile} onSave={() => { setEditMode(false); setOpen(false); }} onCancel={() => setEditMode(false)} />
            ) : (
              <ProfileView profile={profile} onClose={() => setOpen(false)} onEdit={() => setEditMode(true)} />
            )
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No health profile found.</p>
              <p className="text-sm mt-2">Complete your onboarding to create your health profile.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ProfileView({ profile, onClose, onEdit }: { profile: any; onClose: () => void; onEdit: () => void }) {
  const formatArray = (arr: string[] | null) => {
    if (!arr || arr.length === 0) return 'None specified';
    return arr.map(item => item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'Not specified';
    return value;
  };

  // Check if profile is complete
  const isProfileComplete = profile && 
    profile.profileCompletedAt != null &&
    profile.gender != null &&
    profile.age != null && Number.isFinite(Number(profile.age)) &&
    profile.height != null && Number.isFinite(Number(profile.height)) &&
    profile.weight != null && Number.isFinite(Number(profile.weight)) &&
    profile.activityLevel != null &&
    profile.healthGoals && profile.healthGoals.length > 0;

  const missingFields = [];
  if (!profile.gender) missingFields.push('Gender');
  if (!profile.age) missingFields.push('Age');
  if (!profile.height) missingFields.push('Height');
  if (!profile.weight) missingFields.push('Weight');
  if (!profile.activityLevel) missingFields.push('Activity Level');
  if (!profile.healthGoals || profile.healthGoals.length === 0) missingFields.push('Health Goals');

  return (
    <div className="space-y-6 p-4">
      {/* Profile Status */}
      {!isProfileComplete && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Profile Incomplete
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Missing: {missingFields.join(', ')}. Complete your profile to get personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Gender</label>
            <p className="text-sm capitalize">{formatValue(profile.gender)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Age</label>
            <p className="text-sm">{formatValue(profile.age)} years</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Height</label>
            <p className="text-sm">{formatValue(profile.height)} cm</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Weight</label>
            <p className="text-sm">{formatValue(profile.weight)} kg</p>
          </div>
          {profile.goalWeight && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Goal Weight</label>
              <p className="text-sm">{profile.goalWeight} kg</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Activity Level</label>
            <p className="text-sm capitalize">{formatValue(profile.activityLevel)?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Health Goals */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Health Goals</h3>
        <div className="flex flex-wrap gap-2">
          {profile.healthGoals?.length > 0 ? (
            profile.healthGoals.map((goal: string, index: number) => (
              <Badge key={index} variant="secondary">
                {goal.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No health goals specified</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Medical Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Medical Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
            <p className="text-sm">{formatArray(profile.medicalConditions)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Allergies</label>
            <p className="text-sm">{formatArray(profile.allergies)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Medications</label>
            <p className="text-sm">{formatArray(profile.medications)}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Dietary Preferences */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Dietary Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {profile.dietaryPreferences?.length > 0 ? (
            profile.dietaryPreferences.map((pref: string, index: number) => (
              <Badge key={index} variant="outline">
                {pref === 'none' ? 'No specific diet' : pref.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No dietary preferences specified</p>
          )}
        </div>
      </div>

      {/* Profile completion info */}
      {profile.profileCompletedAt && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            Profile completed on {new Date(profile.profileCompletedAt).toLocaleDateString()}
          </p>
          {profile.lastProfileUpdate && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date(profile.lastProfileUpdate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onClose}
          data-testid="button-close-profile"
        >
          Close
        </Button>
        <Button 
          className="flex-1"
          data-testid={isProfileComplete ? "button-edit-profile" : "button-complete-profile"} 
          onClick={() => {
            onClose();
            // For incomplete profiles, trigger onboarding. For complete profiles, show edit functionality.
            if (!isProfileComplete) {
              // Invalidate onboarding status cache to re-trigger onboarding check
              queryClient.invalidateQueries({ queryKey: ['/api/health-profile/onboarding-status'] });
              // This will cause ProtectedRoute to re-check onboarding status and show onboarding form
            } else {
              // For complete profiles, open edit dialog
              onEdit();
            }
          }}
        >
          {isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
        </Button>
      </div>
    </div>
  );
}

function EditProfileForm({ profile, onSave, onCancel }: { profile: any; onSave: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm({
    resolver: zodResolver(insertHealthProfileSchema),
    defaultValues: {
      gender: profile.gender || '',
      age: profile.age || '',
      height: profile.height || '',
      weight: profile.weight || '',
      goalWeight: profile.goalWeight || '',
      activityLevel: profile.activityLevel || '',
      healthGoals: profile.healthGoals || [],
      medicalConditions: profile.medicalConditions || [],
      allergies: profile.allergies || [],
      medications: profile.medications || [],
      dietaryPreferences: profile.dietaryPreferences || [],
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/health-profiles/${currentUser?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, userId: currentUser?.id }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your health profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/health-profiles', currentUser?.id] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const fitnessGoalsOptions = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'general_fitness', label: 'General Fitness' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'strength', label: 'Strength' },
    { value: 'flexibility', label: 'Flexibility' },
    { value: 'stress_relief', label: 'Stress Relief' },
  ];

  const dietaryOptions = [
    { value: 'none', label: 'No specific diet' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Ketogenic' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'gluten_free', label: 'Gluten Free' },
    { value: 'dairy_free', label: 'Dairy Free' },
    { value: 'low_carb', label: 'Low Carb' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'intermittent_fasting', label: 'Intermittent Fasting' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Health Profile</h3>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Basic Information</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-gender">
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
                    <Input {...field} type="number" placeholder="Age" data-testid="input-age" />
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
                    <Input {...field} type="number" placeholder="Height in cm" data-testid="input-height" />
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
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Weight in kg" data-testid="input-weight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goalWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Weight (kg)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Goal weight (optional)" data-testid="input-goal-weight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-activity-level">
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Health Goals */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Health Goals</h4>
          <FormField
            control={form.control}
            name="healthGoals"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2">
                  {fitnessGoalsOptions.map((goal) => (
                    <FormField
                      key={goal.value}
                      control={form.control}
                      name="healthGoals"
                      render={({ field }) => {
                        return (
                          <FormItem key={goal.value} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                data-testid={`checkbox-goal-${goal.value}`}
                                checked={field.value?.includes(goal.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, goal.value])
                                    : field.onChange(field.value?.filter((value) => value !== goal.value));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {goal.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dietary Preferences */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Dietary Preferences</h4>
          <FormField
            control={form.control}
            name="dietaryPreferences"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2">
                  {dietaryOptions.map((diet) => (
                    <FormField
                      key={diet.value}
                      control={form.control}
                      name="dietaryPreferences"
                      render={({ field }) => {
                        return (
                          <FormItem key={diet.value} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                data-testid={`checkbox-diet-${diet.value}`}
                                checked={field.value?.includes(diet.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, diet.value])
                                    : field.onChange(field.value?.filter((value) => value !== diet.value));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {diet.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}