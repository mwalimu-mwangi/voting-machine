import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  UserCheck, 
  BarChart3,
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return "A";
    return user.fullName.split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  // Navigation items with their paths and icons
  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Students", path: "/admin/students", icon: <Users className="h-5 w-5" /> },
    { name: "Positions", path: "/admin/positions", icon: <Award className="h-5 w-5" /> },
    { name: "Candidates", path: "/admin/candidates", icon: <UserCheck className="h-5 w-5" /> },
    { name: "Results", path: "/admin/results", icon: <BarChart3 className="h-5 w-5" /> },
  ];
  
  // Check if a path is the current/active path
  const isActivePath = (path: string) => {
    if (path === "/admin/dashboard" && location === "/admin") return true;
    return location === path;
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-neutral-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-5">
            <div className="flex flex-shrink-0 items-center px-4">
              <Link href="/admin/dashboard">
                <h1 className="text-xl font-bold">
                  <span className="text-primary">Campus</span>
                  <span className="text-secondary">Vote</span>
                  <span className="ml-2 rounded-md bg-secondary-700 px-2 py-1 text-xs text-white">Admin</span>
                </h1>
              </Link>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    isActivePath(item.path)
                      ? "bg-primary-100 text-primary-700"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-neutral-200 p-4">
            <div className="flex items-center">
              <div>
                <Avatar className="h-8 w-8 rounded-full bg-primary-600 text-white">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-700">{user?.fullName || "Admin User"}</p>
                <Button 
                  variant="link" 
                  className="text-xs text-neutral-500 p-0 h-auto"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <div className="md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4">
            <Link href="/admin/dashboard" className="flex-shrink-0">
              <h1 className="text-xl font-bold">
                <span className="text-primary">Campus</span>
                <span className="text-secondary">Vote</span>
                <span className="ml-2 rounded-md bg-secondary-700 px-2 py-1 text-xs text-white">Admin</span>
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8 bg-primary-600 text-white">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.fullName || "Admin User"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">
                      <span className="text-primary">Campus</span>
                      <span className="text-secondary">Vote</span>
                      <span className="ml-2 rounded-md bg-secondary-700 px-2 py-1 text-xs text-white">Admin</span>
                    </h1>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                  <nav className="mt-8 flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                          isActivePath(item.path)
                            ? "bg-primary-100 text-primary-700"
                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="flex items-center justify-start px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="ml-3">Logout</span>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
