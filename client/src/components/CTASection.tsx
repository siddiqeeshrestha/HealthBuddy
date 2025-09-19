import { Link } from 'wouter';

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          Ready to transform your health?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of users who have already started their journey to better health with HealthBuddy.
        </p>
        <Link href="/signup">
          <button 
            data-testid="button-get-started-free"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105"
          >
            Get Started Free
          </button>
        </Link>
      </div>
    </section>
  );
}
