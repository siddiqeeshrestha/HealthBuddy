import { Link } from 'wouter';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-semibold text-foreground">{t('common.healthbuddy')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher variant="header" />
            {currentUser ? (
              <Link href="/dashboard">
                <button 
                  data-testid="button-dashboard"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
                >
                  {t('common.dashboard')}
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button 
                    data-testid="button-login"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('common.login')}
                  </button>
                </Link>
                <Link href="/signup">
                  <button 
                    data-testid="button-get-started"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
                  >
                    {t('common.getStarted')}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
