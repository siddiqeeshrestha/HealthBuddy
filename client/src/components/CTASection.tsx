import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function CTASection() {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          {t('cta.title')}
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('cta.subtitle')}
        </p>
        <Link href="/signup">
          <button 
            data-testid="button-get-started-free"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105"
          >
            {t('cta.button')}
          </button>
        </Link>
      </div>
    </section>
  );
}
