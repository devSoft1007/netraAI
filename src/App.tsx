import { Switch, Route, useLocation, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Appointments from "@/pages/appointments";
import Procedures from "@/pages/procedures";
import AiDiagnosis from "@/pages/ai-diagnosis";
import Billing from "@/pages/billing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";
import './App.css';

const base = process.env.NODE_ENV === 'production' ? '/netraAI' : '';

function AppRouter() {
  return (
    <Switch>
      {/* Authentication Routes - No header for these */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Main App Routes - With header */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/procedures" component={Procedures} />
      <Route path="/ai-diagnosis" component={AiDiagnosis} />
      <Route path="/billing" component={Billing} />
      <Route component={NotFound} />
    </Switch>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* <Router base={base}> */}
        <AuthWrapper />
        {/* </Router> */}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function AuthWrapper() {
  const [location] = useLocation();
  
  // Routes that don't need the header
  const authRoutes = ['/login', '/signup'];
  const showHeader = !authRoutes.includes(location);

  return (
    <div className="min-h-screen bg-clinical-white">
      {showHeader && <Header />}
      <AppRouter />
    </div>
  );
}

export default App;
