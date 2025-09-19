import { CheckCircle, BarChart, Heart, Search } from 'lucide-react';

const features = [
  {
    icon: CheckCircle,
    title: 'Personalized Plans',
    description: 'Customized health and fitness plans tailored to your unique goals and lifestyle.'
  },
  {
    icon: BarChart,
    title: 'Daily Tracking',
    description: 'Monitor your progress with intuitive tracking tools for exercise, nutrition, and vital signs.'
  },
  {
    icon: Heart,
    title: 'AI Mental Wellness',
    description: 'Get personalized mental health support and stress management techniques powered by AI.'
  },
  {
    icon: Search,
    title: 'Symptom Checker',
    description: 'Intelligent symptom analysis to help you understand your health concerns and when to seek care.'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need for better health
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive health management powered by AI to help you make informed decisions about your wellbeing.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              data-testid={`feature-${index}`}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
