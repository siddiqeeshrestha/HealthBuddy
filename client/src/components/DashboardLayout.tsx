import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'wouter';
import { 
  CheckCircle, 
  Home, 
  Target, 
  Activity, 
  Brain, 
  LogOut, 
  User,
  Menu,
  X,
  LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
    </>
  );
}