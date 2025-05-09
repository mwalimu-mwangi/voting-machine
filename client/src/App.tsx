import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Route, Switch, useLocation } from "wouter";
import IndexPage from "@/pages/index-page";
import AdminDashboard from "@/pages/admin/dashboard";
import TeachersPage from "@/pages/admin/teachers-fix";
import SettingsSimplePage from "@/pages/admin/settings-simple";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function AppRouter() {
  const [location, setLocation] = useLocation();
  
  // Redirect based on authentication status
  useEffect(() => {
    // Check if user is authenticated
    const userRole = localStorage.getItem("userRole");
    
    // If not authenticated, redirect to auth page for any protected routes
    if (!userRole) {
      // List of routes that should be accessible without authentication
      const publicRoutes = ['/auth'];
      
      // Check if current route is public
      const isPublicRoute = publicRoutes.some(route => location === route || location.startsWith(route + '/'));
      
      // If not a public route and not authenticated, redirect to auth
      if (!isPublicRoute) {
        setLocation("/auth");
      }
    } else if (userRole === "student") {
      // If student is authenticated and on root, redirect to student portal
      if (location === "/") {
        setLocation("/student");
      }
      
      // Prevent students from accessing admin routes
      if (location.startsWith("/admin")) {
        setLocation("/student");
      }
    } else if (userRole === "admin") {
      // If admin is authenticated and on root, redirect to admin dashboard
      if (location === "/") {
        setLocation("/admin");
      }
    }
  }, [location, setLocation]);
  
  return (
    <Switch>
      <Route path="/student" component={IndexPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/teachers" component={TeachersPage} />
      <Route path="/admin/settings" component={SettingsSimplePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="voting-system-theme">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
