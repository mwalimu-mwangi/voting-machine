import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminStudents from "@/pages/admin/students";
import AdminPositions from "@/pages/admin/positions";
import AdminCandidates from "@/pages/admin/candidates";
import AdminResults from "@/pages/admin/results";
import VoterHome from "@/pages/voter/home";
import VoterBallot from "@/pages/voter/ballot";
import VoterCandidates from "@/pages/voter/candidates";
import VoterResults from "@/pages/voter/results";

function Router() {
  return (
    <Switch>
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} role="admin" />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} role="admin" />
      <ProtectedRoute path="/admin/students" component={AdminStudents} role="admin" />
      <ProtectedRoute path="/admin/positions" component={AdminPositions} role="admin" />
      <ProtectedRoute path="/admin/candidates" component={AdminCandidates} role="admin" />
      <ProtectedRoute path="/admin/results" component={AdminResults} role="admin" />

      {/* Voter routes */}
      <ProtectedRoute path="/" component={VoterHome} role="student" />
      <ProtectedRoute path="/ballot" component={VoterBallot} role="student" />
      <ProtectedRoute path="/candidates" component={VoterCandidates} role="student" />
      <ProtectedRoute path="/results" component={VoterResults} role="student" />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
