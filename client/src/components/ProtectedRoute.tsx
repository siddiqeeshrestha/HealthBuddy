import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { ReactNode, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import HealthProfileOnboarding from '@/pages/HealthProfileOnboarding';
import { Loader2 } from 'lucide-react';
import { type HealthProfile } from '@shared/schema';

interface ProtectedRouteProps {
  children: ReactNode;
}

interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  needsWeeklyUpdate: boolean;
  lastUpdateDays: number;
  profile: HealthProfile | null;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check onboarding status for authenticated users
  const { data: onboardingStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery<OnboardingStatus>({
    queryKey: ['/api/health-profile/onboarding-status'],
    enabled: !!currentUser,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!currentUser) {
      setLocation('/');
    }
  }, [currentUser, setLocation]);

  useEffect(() => {
    if (currentUser && onboardingStatus && !onboardingStatus.hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [currentUser, onboardingStatus]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchStatus();
  };

  if (!currentUser) {
    return null;
  }

  // Show loading spinner while checking onboarding status
  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Setting up your health profile...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't completed it
  if (showOnboarding) {
    return <HealthProfileOnboarding onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
}
