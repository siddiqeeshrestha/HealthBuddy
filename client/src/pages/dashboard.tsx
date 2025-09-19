import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { CheckCircle, Zap, Droplets, Moon, Heart, Search, Calendar, MessageCircle, LogOut, User } from 'lucide-react';

const healthStats = [
  {
    title: 'Steps Today',
    value: '8,547',
    change: '+12% from yesterday',
    icon: Zap,
  },
  {
    title: 'Water Intake',
    value: '6/8 glasses',
    change: '2 glasses remaining',
    icon: Droplets,
  },
  {
    title: 'Sleep',
    value: '7h 32m',
    change: 'Quality sleep achieved',
    icon: Moon,
  },
  {
    title: 'Wellness Score',
    value: '87/100',
    change: 'Excellent progress!',
    icon: Heart,
  },
];

const activities = [
  {
    title: 'Morning Walk',
    description: '30 minutes • 2,847 steps',
    time: '7:30 AM',
    icon: Zap,
  },
  {
    title: 'Hydration Reminder',
    description: 'Drank 2 glasses of water',
    time: '10:15 AM',
    icon: Droplets,
  },
  {
    title: 'Meditation Session',
    description: '15 minutes mindfulness',
    time: '2:00 PM',
    icon: Heart,
  },
];

const quickActions = [
  {
    title: 'Symptom Checker',
    icon: Search,
  },
  {
    title: 'Plan Meals',
    icon: Calendar,
  },
  {
    title: 'AI Wellness Chat',
    icon: MessageCircle,
  },
];

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const firstName = currentUser?.displayName?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-semibold text-foreground">HealthBuddy</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="#" 
                data-testid="nav-dashboard"
                className="text-primary font-medium"
              >
                Dashboard
              </a>
              <a 
                href="#" 
                data-testid="nav-tracking"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Tracking
              </a>
              <a 
                href="#" 
                data-testid="nav-plans"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Plans
              </a>
              <a 
                href="#" 
                data-testid="nav-wellness"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Wellness
              </a>
              <a 
                href="#" 
                data-testid="nav-reports"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Reports
              </a>
            </nav>
            
            <div className="flex items-center space-x-4">
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
              <button 
                onClick={handleLogout}
                data-testid="button-logout"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, <span data-testid="text-first-name">{firstName}</span>!
          </h1>
          <p className="text-muted-foreground">Here's how your health journey is going today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthStats.map((stat, index) => (
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
                {activities.map((activity, index) => (
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
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations & Quick Actions */}
          <div className="space-y-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                <div 
                  className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                  data-testid="recommendation-0"
                >
                  <h4 className="font-medium text-foreground mb-2">Increase Protein Intake</h4>
                  <p className="text-sm text-muted-foreground">Based on your fitness goals, consider adding 20g more protein to support muscle recovery.</p>
                </div>
                <div 
                  className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                  data-testid="recommendation-1"
                >
                  <h4 className="font-medium text-foreground mb-2">Evening Wind-Down</h4>
                  <p className="text-sm text-muted-foreground">Try a 10-minute breathing exercise before bed to improve sleep quality.</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button 
                    key={index}
                    data-testid={`action-${index}`}
                    className="w-full flex items-center space-x-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    <action.icon className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{action.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
