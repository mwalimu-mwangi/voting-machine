import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Download } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminResults() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  
  // Query positions data
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
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
  
  // Handle export results
  const handleExportResults = () => {
    if (!overallResults) return;
    
    // Create CSV content
    let csvContent = "Position,Candidate,Department,Year,Votes\n";
    
    overallResults.forEach((result: any) => {
      csvContent += `"${result.position_name}","${result.candidate_name}","${result.department}","${result.year}",${result.vote_count}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "election_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get total votes for position
  const getTotalVotes = (candidates: any[]) => {
    return candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  };
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Election Results</h2>
        <Button onClick={handleExportResults} disabled={!overallResults}>
          <Download className="mr-2 h-4 w-4" />
          Export Results
        </Button>
      </div>
      
      {/* Overall Results Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Election Results Overview</CardTitle>
          <CardDescription>
            Summary of votes cast for all positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overallLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : positionGroupedResults.length > 0 ? (
            <div className="space-y-8">
              {positionGroupedResults.map((position: any) => (
                <div key={position.positionId} className="border-b pb-6 last:border-0">
                  <h3 className="text-lg font-medium mb-4">{position.positionName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={position.candidates}
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
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={position.candidates}
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
                            {position.candidates.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="mt-4 overflow-x-auto">
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
                        {position.candidates.map((candidate: any) => {
                          const totalVotes = getTotalVotes(position.candidates);
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
                            {getTotalVotes(position.candidates)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-neutral-500">
              No voting results available yet.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detailed Position View */}
      <Card>
        <CardHeader>
          <CardTitle>Position Detail</CardTitle>
          <CardDescription>
            Select a position to view detailed results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positionsData?.positions?.map((position: any) => (
                  <SelectItem key={position.id} value={String(position.id)}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPosition ? (
            positionLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              formattedPositionResults && formattedPositionResults.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formattedPositionResults}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="candidateName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="votes" name="Votes" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
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
                        {formattedPositionResults.map((result: any, index: number) => {
                          const totalVotes = formattedPositionResults.reduce((sum, candidate) => sum + candidate.votes, 0);
                          const percentage = totalVotes > 0 
                            ? ((result.votes / totalVotes) * 100).toFixed(1) 
                            : '0.0';
                            
                          return (
                            <tr key={index}>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">{result.candidateName}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{result.department}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{result.year}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{result.votes}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">{percentage}%</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-neutral-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">Total</td>
                          <td colSpan={2}></td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                            {formattedPositionResults.reduce((sum, result) => sum + result.votes, 0)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-neutral-500">
                  No voting results available for this position.
                </div>
              )
            )
          ) : (
            <div className="text-center p-8 text-neutral-500">
              Please select a position to view detailed results.
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
