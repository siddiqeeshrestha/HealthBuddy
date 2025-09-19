import { CheckCircle, BarChart, Heart, Search, Activity, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FeaturesSection() {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: Activity,
      titleKey: 'features.smartTracking.title',
      descriptionKey: 'features.smartTracking.description'
    },
    {
      icon: Heart,
      titleKey: 'features.aiInsights.title',
      descriptionKey: 'features.aiInsights.description'
    },
    {
      icon: CheckCircle,
      titleKey: 'features.personalizedPlans.title',
      descriptionKey: 'features.personalizedPlans.description'
    },
    {
      icon: Heart,
      titleKey: 'features.mentalWellness.title',
      descriptionKey: 'features.mentalWellness.description'
    },
    {
      icon: Search,
      titleKey: 'features.symptomChecker.title',
      descriptionKey: 'features.symptomChecker.description'
    },
    {
      icon: ShoppingCart,
      titleKey: 'features.smartGrocery.title',
      descriptionKey: 'features.smartGrocery.description'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              data-testid={`feature-${index}`}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{t(feature.titleKey)}</h3>
              <p className="text-muted-foreground">{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
