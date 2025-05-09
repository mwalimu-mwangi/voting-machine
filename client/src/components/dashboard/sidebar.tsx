import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  Home,
  Building2,
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Departments",
      href: "/admin/departments",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      name: "Courses",
      href: "/admin/courses",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Students",
      href: "/admin/students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Elections",
      href: "/admin/elections",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Results",
      href: "/admin/results",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "bg-primary-dark text-white w-full md:w-64 md:min-h-screen flex flex-col md:fixed z-30",
        !isOpen && "md:w-20",
        className
      )}
    >
      <div className="flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          {isOpen && <h1 className="text-xl font-bold font-heading">VoteSystem</h1>}
        </div>
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleSidebar}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <button
          className="hidden md:block text-white focus:outline-none"
          onClick={toggleSidebar}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            )}
          </svg>
        </button>
      </div>

      <div className="px-4 py-2 md:py-6">
        {isOpen && (
          <div className="flex items-center space-x-2 mb-6">
            <div className="bg-white rounded-full p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm opacity-70">Admin</p>
              <p className="font-medium">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition",
                isActive(item.href)
                  ? "bg-white/10 text-white"
                  : "text-white/80 hover:bg-white/10"
              )}
            >
              {item.icon}
              {isOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition"
          )}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
