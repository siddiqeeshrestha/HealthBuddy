import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-semibold text-foreground">{t('common.healthbuddy')}</span>
          </div>
          <p className="text-muted-foreground mb-4">
            {t('footer.tagline')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
