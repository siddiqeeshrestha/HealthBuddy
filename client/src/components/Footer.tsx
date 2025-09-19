import { CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-semibold text-foreground">HealthBuddy</span>
          </div>
          <p className="text-muted-foreground">
            Your personal AI health companion for a better tomorrow.
          </p>
        </div>
      </div>
    </footer>
  );
}
