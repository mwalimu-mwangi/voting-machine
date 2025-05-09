import { Eye, Check, AlertTriangle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Define activity type for type safety
interface Activity {
  id: number;
  type: 'registration' | 'vote' | 'login_failure' | 'setting_change';
  message: string;
  timestamp: string;
  icon: React.ReactNode;
  iconClass: string;
}

// Mock data generator for demonstration
function generateMockActivities(): Activity[] {
  const now = new Date();
  
  return [
    {
      id: 1,
      type: 'registration',
      message: 'New student registered',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(), // 5 minutes ago
      icon: <Eye className="h-5 w-5" />,
      iconClass: 'bg-primary/10 text-primary'
    },
    {
      id: 2,
      type: 'vote',
      message: 'Vote cast',
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(), // 12 minutes ago
      icon: <Check className="h-5 w-5" />,
      iconClass: 'bg-success/10 text-success'
    },
    {
      id: 3,
      type: 'login_failure',
      message: 'Failed login attempt',
      timestamp: new Date(now.getTime() - 25 * 60000).toISOString(), // 25 minutes ago
      icon: <AlertTriangle className="h-5 w-5" />,
      iconClass: 'bg-warning/10 text-warning'
    },
    {
      id: 4,
      type: 'setting_change',
      message: 'Admin updated settings',
      timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), // 1 hour ago
      icon: <Edit className="h-5 w-5" />,
      iconClass: 'bg-info/10 text-info'
    }
  ];
}

// Format relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMillis = now.getTime() - activityTime.getTime();
  
  const diffSeconds = Math.floor(diffMillis / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return activityTime.toLocaleDateString();
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // In a real implementation, this would fetch from an API
  // For demo purposes, we're just generating mock data
  useEffect(() => {
    setActivities(generateMockActivities());
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h2 className="text-lg font-heading font-semibold mb-4">Recent Activity</h2>

      {activities.length === 0 ? (
        <div className="py-6 text-center text-neutral-500">
          <p>No recent activity to display</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="border-b border-neutral-200 py-3 flex items-start">
            <div className={`p-2 rounded-full mr-3 ${activity.iconClass}`}>
              {activity.icon}
            </div>
            <div>
              <p className="text-neutral-900 font-medium">{activity.message}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}

      <div className="mt-3">
        <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium flex items-center p-0">
          <span>View all activity</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
