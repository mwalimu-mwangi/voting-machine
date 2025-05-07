import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username or Student ID is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Student ID must be at least 3 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle login submit
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  // Handle register submit
  const onRegisterSubmit = (values: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };
  
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Left side - Auth forms */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">
              <span className="text-primary">Campus</span>
              <span className="text-secondary">Vote</span>
            </h1>
            <p className="mt-2 text-neutral-600">
              {activeTab === "login"
                ? "Login to your account"
                : "Create your account"}
            </p>
          </div>
          
          <Card className="overflow-hidden bg-white shadow">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Unified Login Form (Admin and Student) */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-neutral-500">Login as admin or student with your credentials</p>
                      </div>
                      
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username or Student ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username or student ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                            <div className="mt-1 flex justify-between">
                              <div className="text-sm">
                                <Link href="#" className="font-medium text-primary-600 hover:text-primary-700">
                                  Forgot password?
                                </Link>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Login
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => setActiveTab("register")}
                      >
                        Register with Student ID
                      </Button>
                      
                      <div className="mt-4 text-center">
                        <p className="text-xs text-neutral-500">
                          Admin users can log in with their admin credentials.<br />
                          Students should use their student ID and password.
                        </p>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Registration Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your student ID" {...field} />
                            </FormControl>
                            <FormMessage />
                            <p className="mt-1 text-xs text-neutral-500">Your student ID must be verified in our system</p>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                            <p className="mt-1 text-xs text-neutral-500">Password must be at least 8 characters</p>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Register
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => setActiveTab("login")}
                      >
                        Back to Login
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                

              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Right side - Hero section (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight">Campus Vote</h2>
            <p className="mt-4 text-lg">
              The secure platform for student government elections.
            </p>
            
            <div className="mt-12 space-y-8">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-xl font-semibold">Secure Voting</h3>
                <p className="mt-2">
                  Our system ensures that each student can only vote once per position
                  using secure authentication and verification.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-xl font-semibold">Real-time Results</h3>
                <p className="mt-2">
                  Track election results in real-time with interactive
                  visualizations and detailed statistics.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-xl font-semibold">Student Verification</h3>
                <p className="mt-2">
                  Only verified students can register and participate in
                  the election process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
