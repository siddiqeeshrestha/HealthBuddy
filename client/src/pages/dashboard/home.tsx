import { useAuth } from '@/contexts/AuthContext';
import { Zap, Droplets, Moon, Heart, Search, Calendar, MessageCircle, TrendingUp, Activity, Scale } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

const quickActions = [
  {
    title: 'Symptom Checker',
    icon: Search,
    href: '/dashboard/symptom-checker',
  },
  {
    title: 'Smart Grocery',
    icon: Calendar,
    href: '/dashboard/smart-grocery',
  },
  {
    title: 'AI Wellness Chat',
    icon: MessageCircle,
    href: '/dashboard/wellness',
  },
];

export default function DashboardHome() {
  const { currentUser } = useAuth();

  // Fetch user's recent tracking data
  const { data: todayStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/tracking/today'],
    enabled: !!currentUser?.id,
  });

  // Fetch recent mental wellness entries
  const { data: recentWellness, isLoading: wellnessLoading } = useQuery({
    queryKey: ['/api/mental-wellness/recent'],
    enabled: !!currentUser?.id,
  });

  // Fetch user's health profile for wellness score calculation
  const { data: healthProfile } = useQuery({
    queryKey: [`/api/health-profiles/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  const firstName = currentUser?.displayName?.split(' ')[0] || 'User';

  if (statsLoading || wellnessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  // Process real data for stats
  const processedStats = processTrackingData(todayStats, recentWellness, healthProfile);
  const recentActivities = generateRecentActivities(todayStats, recentWellness);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, <span data-testid="text-first-name">{firstName}</span>!
        </h1>
        <p className="text-muted-foreground">Here's how your health journey is going today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {processedStats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-card p-6 rounded-xl shadow-sm border border-border"
            data-testid={`stat-${index}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p 
                  className="text-2xl font-bold text-foreground"
                  data-testid={`stat-value-${index}`}
                >
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6">Today's Activities</h3>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg"
                    data-testid={`activity-${index}`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <activity.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No activities tracked today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start tracking your health activities to see them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendations & Quick Actions */}
        <div className="space-y-8">
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
            <div className="space-y-4">
              {generateAIRecommendations(healthProfile, todayStats, recentWellness).map((rec, index) => (
                <div 
                  key={index}
                  className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                  data-testid={`recommendation-${index}`}
                >
                  <h4 className="font-medium text-foreground mb-2">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="w-full flex items-center space-x-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  data-testid={`action-${index}`}
                >
                  <action.icon className="w-5 h-5 text-primary" />
                  <span className="text-foreground">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to process real data
function processTrackingData(todayStats: any, recentWellness: any, healthProfile: any) {
  const stats = [];

  // Calories/Nutrition
  const nutritionEntries = todayStats?.filter((entry: any) => entry.type === 'nutrition') || [];
  const totalCalories = nutritionEntries.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
  
  stats.push({
    title: 'Calories Today',
    value: totalCalories > 0 ? `${totalCalories.toLocaleString()}` : '0',
    change: totalCalories > 0 ? `${nutritionEntries.length} meals logged` : 'No meals logged',
    icon: Zap,
  });

  // Water Intake
  const waterEntries = todayStats?.filter((entry: any) => entry.type === 'water') || [];
  const totalWater = waterEntries.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
  const waterInGlasses = Math.round(totalWater / 250); // Assuming 250ml per glass
  
  stats.push({
    title: 'Water Intake',
    value: waterInGlasses > 0 ? `${waterInGlasses}/8 glasses` : '0/8 glasses',
    change: waterInGlasses >= 8 ? 'Daily goal achieved!' : `${8 - waterInGlasses} glasses remaining`,
    icon: Droplets,
  });

  // Sleep
  const sleepEntries = todayStats?.filter((entry: any) => entry.type === 'sleep') || [];
  const latestSleep = sleepEntries[sleepEntries.length - 1];
  
  stats.push({
    title: 'Sleep',
    value: latestSleep ? `${latestSleep.value}h` : 'Not tracked',
    change: latestSleep?.metadata?.quality ? `Quality: ${latestSleep.metadata.quality}/10` : 'No sleep data',
    icon: Moon,
  });

  // Wellness Score (based on recent mental wellness data)
  const latestWellness = recentWellness?.[0];
  let wellnessScore = 50; // Default
  
  if (latestWellness) {
    const { moodRating, energyLevel, stressLevel, anxietyLevel } = latestWellness;
    wellnessScore = Math.round(
      ((moodRating || 5) + (energyLevel || 5) + (10 - (stressLevel || 5)) + (10 - (anxietyLevel || 5))) / 4 * 10
    );
  }
  
  stats.push({
    title: 'Wellness Score',
    value: `${wellnessScore}/100`,
    change: wellnessScore >= 80 ? 'Excellent progress!' : wellnessScore >= 60 ? 'Good progress' : 'Room for improvement',
    icon: Heart,
  });

  return stats;
}

function generateRecentActivities(todayStats: any, recentWellness: any) {
  const activities = [];
  
  if (todayStats) {
    // Exercise activities
    const exercises = todayStats.filter((entry: any) => entry.type === 'exercise');
    exercises.forEach((exercise: any) => {
      activities.push({
        title: exercise.metadata?.exerciseType || 'Exercise',
        description: `${exercise.value || 0} minutes • ${exercise.metadata?.intensity || 'moderate'} intensity`,
        time: new Date(exercise.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: Activity,
      });
    });

    // Water intake
    const waterEntries = todayStats.filter((entry: any) => entry.type === 'water');
    if (waterEntries.length > 0) {
      const totalWater = waterEntries.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      activities.push({
        title: 'Hydration',
        description: `${Math.round(totalWater)}ml water intake`,
        time: new Date(waterEntries[waterEntries.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: Droplets,
      });
    }

    // Weight tracking
    const weightEntries = todayStats.filter((entry: any) => entry.type === 'weight');
    if (weightEntries.length > 0) {
      const latestWeight = weightEntries[weightEntries.length - 1];
      activities.push({
        title: 'Weight Check',
        description: `${latestWeight.value} ${latestWeight.unit}`,
        time: new Date(latestWeight.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: Scale,
      });
    }
  }

  // Mental wellness activities
  if (recentWellness?.[0]) {
    const wellness = recentWellness[0];
    activities.push({
      title: 'Wellness Check-in',
      description: `Mood: ${wellness.moodRating}/10 • Energy: ${wellness.energyLevel}/10`,
      time: new Date(wellness.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: Heart,
    });
  }

  // Sort by time (most recent first)
  return activities.sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
    const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
    return timeB - timeA;
  }).slice(0, 5); // Limit to 5 most recent
}

function generateAIRecommendations(healthProfile: any, todayStats: any, recentWellness: any) {
  const recommendations = [];

  // Hydration recommendation
  const waterEntries = todayStats?.filter((entry: any) => entry.type === 'water') || [];
  const totalWater = waterEntries.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
  
  if (totalWater < 2000) { // Less than 2 liters
    recommendations.push({
      title: 'Stay Hydrated',
      description: `You've had ${Math.round(totalWater)}ml of water today. Try to reach at least 2000ml for optimal health.`,
    });
  }

  // Exercise recommendation
  const exerciseEntries = todayStats?.filter((entry: any) => entry.type === 'exercise') || [];
  const totalExercise = exerciseEntries.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
  
  if (totalExercise < 30) {
    recommendations.push({
      title: 'Move More',
      description: 'Aim for at least 30 minutes of physical activity today. Even a short walk can make a difference!',
    });
  }

  // Sleep recommendation
  const sleepEntries = todayStats?.filter((entry: any) => entry.type === 'sleep') || [];
  const latestSleep = sleepEntries[sleepEntries.length - 1];
  
  if (!latestSleep || latestSleep.value < 7) {
    recommendations.push({
      title: 'Prioritize Sleep',
      description: 'Quality sleep is crucial for recovery. Aim for 7-9 hours of sleep tonight for optimal health.',
    });
  }

  // Mental wellness recommendation
  const latestWellness = recentWellness?.[0];
  if (latestWellness && (latestWellness.stressLevel > 7 || latestWellness.anxietyLevel > 7)) {
    recommendations.push({
      title: 'Stress Management',
      description: 'Your stress levels seem elevated. Consider trying some breathing exercises or meditation.',
    });
  }

  // Default recommendations if no data
  if (recommendations.length === 0) {
    recommendations.push(
      {
        title: 'Start Tracking',
        description: 'Begin logging your daily activities to receive personalized health recommendations.',
      },
      {
        title: 'Health Profile',
        description: 'Complete your health profile to get more targeted advice for your wellness journey.',
      }
    );
  }

  return recommendations.slice(0, 3); // Limit to 3 recommendations
}