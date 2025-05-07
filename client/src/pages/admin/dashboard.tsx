import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import StatCard from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users, Award, CheckSquare, Vote } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Query for dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/stats"],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) return { 
          totalStudents: 0, 
          registeredVoters: 0, 
          activePositions: 0, 
          totalVotes: 0 
        };
        return await response.json();
      } catch (error) {
        console.error("Error fetching stats:", error);
        return { 
          totalStudents: 0, 
          registeredVoters: 0, 
          activePositions: 0, 
          totalVotes: 0 
        };
      }
    }
  });
  
  // Query for activity logs
  const { data: activities, isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/activity"],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching activities:", error);
        return [];
      }
    }
  });
  
  // Mock data for charts (in real app, this would come from the backend)
  const votingActivityData = [
    { time: '8:00 AM', votes: 12 },
    { time: '9:00 AM', votes: 19 },
    { time: '10:00 AM', votes: 35 },
    { time: '11:00 AM', votes: 27 },
    { time: '12:00 PM', votes: 42 },
    { time: '1:00 PM', votes: 24 },
    { time: '2:00 PM', votes: 38 },
    { time: '3:00 PM', votes: 51 },
    { time: '4:00 PM', votes: 25 },
    { time: '5:00 PM', votes: 18 },
    { time: '6:00 PM', votes: 36 },
    { time: '7:00 PM', votes: 23 },
  ];
  
  const turnoutData = [
    { department: 'CS', turnout: 72 },
    { department: 'ENG', turnout: 58 },
    { department: 'BUS', turnout: 45 },
    { department: 'ARTS', turnout: 39 },
    { department: 'SCI', turnout: 63 },
  ];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="mb-6 text-2xl font-bold text-neutral-800">Admin Dashboard</h1>
        
        {/* Dashboard Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <div className="col-span-4 flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <StatCard 
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={<Users className="h-5 w-5" />}
                href="/admin/students"
                linkText="View all students"
              />
              <StatCard 
                title="Registered Voters"
                value={stats?.registeredVoters || 0}
                icon={<CheckSquare className="h-5 w-5" />}
                href="/admin/students"
                linkText="View registration analytics"
              />
              <StatCard 
                title="Active Positions"
                value={stats?.activePositions || 0}
                icon={<Award className="h-5 w-5" />}
                href="/admin/positions"
                linkText="Manage positions"
              />
              <StatCard 
                title="Total Votes Cast"
                value={stats?.totalVotes || 0}
                icon={<Vote className="h-5 w-5" />}
                href="/admin/results"
                linkText="View detailed results"
              />
            </>
          )}
        </div>
        
        {/* Voting Data Visualization */}
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voting Activity</CardTitle>
              <p className="text-sm text-neutral-500">Last 12 hours of voting activity</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={votingActivityData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="votes" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voter Turnout by Department</CardTitle>
              <p className="text-sm text-neutral-500">Percentage of registered voters who have voted</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={turnoutData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="turnout" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Timestamp</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Action</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">User</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 bg-white">
                        {activities && activities.length > 0 ? (
                          activities.map((log) => (
                            <tr key={log.id}>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">{log.action}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                                {log.user ? `${log.user.fullName} (${log.user.username})` : 'System'}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{log.details}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                              No recent activity
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="mr-3">View Full Activity Log</Button>
              <Button>Export Log</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
