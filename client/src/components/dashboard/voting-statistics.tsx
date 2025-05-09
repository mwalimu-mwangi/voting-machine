import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  percentage: number;
}

export function VotingStatistics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/stats/votes-by-department"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Global participation rate - average of all departments
  const participationRate = data ? 
    Math.round(data.reduce((sum: number, stat: DepartmentStats) => sum + stat.percentage, 0) / data.length) : 
    0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-5">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          
          <Skeleton className="h-8 w-full mt-6" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-heading font-semibold mb-4">Voting Statistics</h2>
        <div className="py-4 text-center text-error">
          <p>Failed to load voting statistics</p>
        </div>
      </div>
    );
  }

  const barColors = {
    overall: "bg-success",
    department1: "bg-primary",
    department2: "bg-secondary",
    department3: "bg-accent",
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h2 className="text-lg font-heading font-semibold mb-4">Voting Statistics</h2>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Participation Rate</span>
            <span className="text-sm font-medium text-success">{participationRate}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-success rounded-full h-2" 
              style={{ width: `${participationRate}%` }}
            ></div>
          </div>
        </div>

        {data?.map((stat: DepartmentStats, index: number) => (
          <div key={stat.departmentId}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{stat.departmentName}</span>
              <span className={`text-sm font-medium ${index === 0 ? 'text-primary' : index === 1 ? 'text-secondary' : 'text-accent'}`}>
                {stat.percentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className={index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : 'bg-accent'}
                style={{ width: `${stat.percentage}%`, height: '0.5rem', borderRadius: '9999px' }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button 
          variant="link" 
          className="text-primary hover:text-primary-dark text-sm font-medium flex items-center p-0"
        >
          <span>View detailed analytics</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
