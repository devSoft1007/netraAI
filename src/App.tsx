import { Switch, Route, useLocation, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthProvider from "@/components/auth/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Appointments from "@/pages/appointments";
import Procedures from "@/pages/procedures";
import AiDiagnosis from "@/pages/ai-diagnosis";
import Billing from "@/pages/billing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import RegistrationSuccess from "@/pages/registration-success";
import NotFound from "@/pages/not-found";
import './App.css';

const base = process.env.NODE_ENV === 'production' ? '/netraAI' : '';

console.log('Base URL:', base);

function AppRouter() {
  return (
    <Switch>
      {/* Public Authentication Routes */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      <Route path="/signup">
        <PublicRoute>
          <Signup />
        </PublicRoute>
      </Route>
      
      <Route path="/registration-success">
        <PublicRoute restrictWhenAuthenticated={false}>
          <RegistrationSuccess />
        </PublicRoute>
      </Route>
      
      {/* Protected Main App Routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/patients">
        <ProtectedRoute>
          <Patients />
        </ProtectedRoute>
      </Route>
      
      <Route path="/appointments">
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      </Route>
      
      <Route path="/procedures">
        <ProtectedRoute>
          <Procedures />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ai-diagnosis">
        <ProtectedRoute>
          <AiDiagnosis />
        </ProtectedRoute>
      </Route>
      
      <Route path="/billing">
        <ProtectedRoute>
          <Billing />
        </ProtectedRoute>
      </Route>
      
      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {/* <Router base={base}> */}
          <AuthWrapper />
          {/* </Router> */}
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

function AuthWrapper() {
  const [location] = useLocation();
  
  // Routes that don't need the header (public routes)
  const publicRoutes = ['/login', '/signup', '/registration-success'];
  const showHeader = !publicRoutes.includes(location);

  return (
    <div className="min-h-screen bg-clinical-white">
  {showHeader && <Header />}
      <AppRouter />
    </div>
  );
}

export default App;
