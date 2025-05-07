import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VoterLayout from "@/components/voter/voter-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Award } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function VoterResults() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  
  // Query positions data
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
  // Set default position if none selected
  React.useEffect(() => {
    if (!selectedPosition && positionsData?.positions?.length > 0) {
      setSelectedPosition(String(positionsData.positions[0].id));
    }
  }, [positionsData, selectedPosition]);
  
  // Query overall results
  const { data: overallResults, isLoading: overallLoading } = useQuery({
    queryKey: ["/api/results"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });
  
  // Query position-specific results when a position is selected
  const { data: positionResults, isLoading: positionLoading } = useQuery({
    queryKey: ["/api/results", selectedPosition],
    queryFn: async ({ queryKey }) => {
      const [endpoint, positionId] = queryKey;
      const response = await fetch(`${endpoint}/${positionId}`);
      if (!response.ok) throw new Error("Failed to fetch position results");
      return response.json();
    },
    enabled: !!selectedPosition,
  });
  
  // Group results by position for display
  const positionGroupedResults = overallResults ? 
    Object.values(overallResults.reduce((acc: any, curr: any) => {
      if (!acc[curr.position_id]) {
        acc[curr.position_id] = {
          positionId: curr.position_id,
          positionName: curr.position_name,
          candidates: []
        };
      }
      
      acc[curr.position_id].candidates.push({
        candidateId: curr.candidate_id,
        candidateName: curr.candidate_name,
        department: curr.department,
        year: curr.year,
        voteCount: parseInt(curr.vote_count) || 0
      });
      
      return acc;
    }, {})) 
    : [];
  
  // Format position-specific results for chart display
  const formattedPositionResults = positionResults?.map((result: any) => ({
    candidateName: result.candidate_name,
    department: result.department,
    year: result.year,
    votes: parseInt(result.vote_count) || 0
  }));
  
  // Get the current position name
  const getCurrentPositionName = () => {
    if (!positionsData?.positions || !selectedPosition) return "";
    const position = positionsData.positions.find((p: any) => String(p.id) === selectedPosition);
    return position?.name || "";
  };
  
  // Get total votes for a position
  const getTotalVotes = (candidates: any[]) => {
    return candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  };
  
  return (
    <VoterLayout>
      <Card>
        <CardHeader>
          <CardTitle>Election Results</CardTitle>
          <CardDescription>
            View the current results of the election
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positionsLoading || overallLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : positionsData?.positions?.length > 0 ? (
            <Tabs 
              value={selectedPosition || undefined}
              onValueChange={setSelectedPosition}
              className="w-full"
            >
              <TabsList className="mb-6 w-full justify-start overflow-auto">
                {positionsData.positions.map((position: any) => (
                  <TabsTrigger key={position.id} value={String(position.id)}>
                    {position.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {positionsData.positions.map((position: any) => {
                const positionResult = positionGroupedResults.find(
                  (p: any) => p.positionId === position.id
                );
                
                return (
                  <TabsContent key={position.id} value={String(position.id)}>
                    {positionLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold mb-4">{position.name} Results</h2>
                        
                        {positionResult && positionResult.candidates.length > 0 ? (
                          <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={positionResult.candidates}
                                    margin={{ top: 5, right: 20, left: 20, bottom: 50 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                      dataKey="candidateName" 
                                      angle={-45} 
                                      textAnchor="end"
                                      height={70}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="voteCount" name="Votes" fill="hsl(var(--primary))" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={positionResult.candidates}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="voteCount"
                                      nameKey="candidateName"
                                      label={({ candidateName, voteCount, percent }) => 
                                        `${candidateName}: ${voteCount} (${(percent * 100).toFixed(0)}%)`
                                      }
                                    >
                                      {positionResult.candidates.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-neutral-50">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Candidate</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Department</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Year</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Votes</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Percentage</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white">
                                  {positionResult.candidates.map((candidate: any) => {
                                    const totalVotes = getTotalVotes(positionResult.candidates);
                                    const percentage = totalVotes > 0 
                                      ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) 
                                      : '0.0';
                                      
                                    return (
                                      <tr key={candidate.candidateId}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">{candidate.candidateName}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{candidate.department}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{candidate.year}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{candidate.voteCount}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{percentage}%</td>
                                      </tr>
                                    );
                                  })}
                                  <tr className="bg-neutral-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">Total</td>
                                    <td colSpan={2}></td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                                      {getTotalVotes(positionResult.candidates)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">100%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 px-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                              <Award className="h-6 w-6 text-neutral-400" />
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-neutral-900">No results</h3>
                            <p className="mt-1 text-sm text-neutral-500">There are no voting results for this position yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-neutral-900">No positions</h3>
              <p className="mt-1 text-sm text-neutral-500">There are no active positions in the election yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </VoterLayout>
  );
}
