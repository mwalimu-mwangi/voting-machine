import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Vote, 
  Users, 
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

interface VoterLayoutProps {
  children: React.ReactNode;
}

export default function VoterLayout({ children }: VoterLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName.split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  // Navigation items with their paths and icons
  const navItems = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Ballot", path: "/ballot", icon: <Vote className="h-5 w-5" /> },
    { name: "Candidates", path: "/candidates", icon: <Users className="h-5 w-5" /> },
    { name: "Results", path: "/results", icon: <BarChart3 className="h-5 w-5" /> },
  ];
  
  // Check if a path is the current/active path
  const isActivePath = (path: string) => {
    return location === path;
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-primary-600 shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            {/* Logo and desktop navigation */}
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/">
                  <a className="text-xl font-bold text-white">
                    <span>Campus</span>
                    <span className="text-secondary-500">Vote</span>
                  </a>
                </Link>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActivePath(item.path)
                        ? "border-b-2 border-white text-white"
                        : "border-b-2 border-transparent text-primary-100 hover:border-primary-300 hover:text-white"
                    }`}>
                      {item.name}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* User dropdown and mobile menu button */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="relative ml-3 flex items-center space-x-3">
                  <span className="hidden md:block text-sm text-white">
                    {user?.fullName} ({user?.username})
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8 bg-primary-500 text-white">
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user?.fullName}</DropdownMenuLabel>
                      <DropdownMenuLabel className="text-xs text-neutral-500">
                        {user?.username}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild className="sm:hidden">
                      <Button variant="ghost" size="icon" className="ml-2">
                        <Menu className="h-6 w-6 text-white" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="sm:max-w-xs">
                      <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">
                          <span className="text-primary">Campus</span>
                          <span className="text-secondary">Vote</span>
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
                      <div className="mt-4">
                        <div className="flex items-center space-x-3 mb-6">
                          <Avatar className="h-10 w-10 bg-primary-500 text-white">
                            <AvatarFallback>{getUserInitials()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user?.fullName}</p>
                            <p className="text-xs text-neutral-500">{user?.username}</p>
                          </div>
                        </div>
                      </div>
                      <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                          <Link key={item.path} href={item.path}>
                            <a 
                              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                                isActivePath(item.path)
                                  ? "bg-primary-100 text-primary-700"
                                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              {item.icon}
                              <span className="ml-3">{item.name}</span>
                            </a>
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
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`block py-2 pl-3 pr-4 text-base font-medium ${
                  isActivePath(item.path)
                    ? "border-l-4 border-white bg-primary-700 text-white"
                    : "border-l-4 border-transparent text-primary-100 hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                }`}>
                  {item.name}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
