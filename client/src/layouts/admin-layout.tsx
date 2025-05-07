import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  User,
  Users,
  UserPlus,
  VoteIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Navigation items
  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/admin/students",
      label: "Students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/positions",
      label: "Positions",
      icon: <VoteIcon className="h-5 w-5" />,
    },
    {
      href: "/admin/candidates",
      label: "Candidates",
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      href: "/admin/results",
      label: "Results",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Render navigation for desktop
  const renderDesktopNav = () => (
    <nav className="bg-primary-700 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-xl font-bold text-white">
                Campus<span className="text-secondary-500">Vote</span>{" "}
                <span className="ml-2 rounded-md bg-secondary-700 px-2 py-1 text-xs text-white">
                  Admin
                </span>
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center ${
                    location === item.href
                      ? "border-b-2 border-white text-white"
                      : "border-b-2 border-transparent text-primary-100 hover:border-primary-300 hover:text-white"
                  } px-1 pt-1 text-sm font-medium`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="relative ml-3">
                <div className="flex items-center space-x-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2 text-white hover:bg-primary-600"
                      >
                        <span className="hidden sm:inline text-sm">
                          {user?.fullName}
                        </span>
                        <Avatar className="h-8 w-8 bg-primary-500 text-white">
                          <AvatarFallback>
                            {getInitials(user?.fullName || "")}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
  
  // Render mobile navigation
  const renderMobileNav = () => (
    <div className="flex h-16 items-center justify-between bg-primary-700 px-4">
      <span className="text-xl font-bold text-white">
        Campus<span className="text-secondary-500">Vote</span>{" "}
        <span className="ml-2 rounded-md bg-secondary-700 px-2 py-1 text-xs text-white">
          Admin
        </span>
      </span>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
          <div className="flex h-16 items-center justify-between bg-primary-700 px-4">
            <span className="text-xl font-bold text-white">
              Campus<span className="text-secondary-500">Vote</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="px-2 py-4">
            <div className="flex items-center space-x-3 p-4">
              <Avatar className="h-10 w-10 bg-primary-500 text-white">
                <AvatarFallback>
                  {getInitials(user?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-sm text-neutral-500">Admin</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                      location === item.href
                        ? "bg-primary-100 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {React.cloneElement(item.icon, {
                      className: "mr-3 h-5 w-5",
                    })}
                    {item.label}
                  </div>
                </Link>
              ))}
              
              <div 
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer mt-4"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {isMobile ? renderMobileNav() : renderDesktopNav()}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
