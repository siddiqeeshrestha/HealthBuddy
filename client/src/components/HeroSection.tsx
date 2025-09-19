import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {currentUser ? (
            <Link href="/dashboard">
              <button 
                data-testid="button-dashboard-hero"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105"
              >
                {t('common.dashboard')}
              </button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <button 
                  data-testid="button-start-journey"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105"
                >
                  {t('hero.cta')}
                </button>
              </Link>
              <Link href="/login">
                <button 
                  data-testid="button-have-account"
                  className="border border-border hover:bg-accent text-foreground px-8 py-4 rounded-lg text-lg font-medium transition-colors"
                >
                  {t('common.login')}
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
