import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import DashboardHome from "@/pages/dashboard/home";
import DailyTracking from "@/pages/dashboard/tracking";
import SymptomChecker from "@/pages/dashboard/symptom-checker";
import MentalWellness from "@/pages/dashboard/MentalWellness";
import SmartGrocery from "@/pages/dashboard/SmartGrocery";
import HealthPlans from "@/pages/health-plans";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" nest>
        <ProtectedRoute>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={DashboardHome} />
              <Route path="/plans" component={HealthPlans} />
              <Route path="/tracking" component={DailyTracking} />
              <Route path="/symptoms" component={SymptomChecker} />
              <Route path="/wellness" component={MentalWellness} />
              <Route path="/grocery" component={SmartGrocery} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
