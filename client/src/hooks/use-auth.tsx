import { createContext, ReactNode, useContext, useState } from "react";
import { UserRole } from "@shared/schema";

// Simplified Auth Context for troubleshooting
type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isStudent: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Simple login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (username === 'admin' && password === 'password') {
        // Mock admin user for testing
        setUser({
          id: 1,
          username: 'admin',
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@example.com',
          role: UserRole.ADMIN
        });
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Simple logout function
  const logout = async () => {
    setUser(null);
  };

  // Determine user role
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStudent = user?.role === UserRole.STUDENT;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAdmin,
        isStudent,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
