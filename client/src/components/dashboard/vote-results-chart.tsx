import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Position, Candidate, Student, User } from "@shared/schema";

interface VoteCount {
  candidateId: number;
  count: number;
}

interface CandidateWithVotes extends Candidate {
  student?: {
    id: number;
    userId: number;
    studentId: string;
    departmentId: number;
    courseId: number;
    levelId: number;
    user?: User;
  };
  voteCount: number;
  percentage: number;
}

interface ChartData {
  name: string;
  votes: number;
  candidateId: number;
}

export function VoteResultsChart() {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  // Fetch all positions
  const positionsQuery = useQuery({
    queryKey: ["/api/positions"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch candidates for selected position
  const candidatesQuery = useQuery({
    queryKey: ["/api/positions", selectedPosition, "candidates"],
    enabled: !!selectedPosition,
  });
  
  // Fetch vote counts for selected position
  const votesQuery = useQuery({
    queryKey: ["/api/positions", selectedPosition, "votes"],
    enabled: !!selectedPosition,
  });
  
  // Auto-select first position when positions load
  useEffect(() => {
    if (positionsQuery.data && positionsQuery.data.length > 0 && !selectedPosition) {
      setSelectedPosition(positionsQuery.data[0].id);
    }
  }, [positionsQuery.data, selectedPosition]);
  
  // Process data for chart when votes and candidates load
  useEffect(() => {
    if (votesQuery.data && candidatesQuery.data) {
      const voteMap = new Map<number, number>();
      
      // Map vote counts to candidate IDs
      votesQuery.data.forEach((vote: VoteCount) => {
        voteMap.set(vote.candidateId, vote.count);
      });
      
      // Calculate total votes
      const totalVotes = Array.from(voteMap.values()).reduce((sum, count) => sum + count, 0);
      
      // Create chart data
      const data: ChartData[] = candidatesQuery.data.map((candidate: Candidate & { student?: { user?: User } }) => ({
        name: candidate.student?.user ? 
          `${candidate.student.user.firstName} ${candidate.student.user.lastName}` : 
          `Candidate ${candidate.id}`,
        votes: voteMap.get(candidate.id) || 0,
        candidateId: candidate.id,
      }));
      
      setChartData(data);
    }
  }, [votesQuery.data, candidatesQuery.data]);
  
  // Colors for the bars
  const colors = ['#3f51b5', '#f50057', '#00bcd4', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'];
  
  // Loading state
  const isLoading = positionsQuery.isLoading || 
    (!!selectedPosition && (candidatesQuery.isLoading || votesQuery.isLoading));
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-heading font-semibold">Vote Results by Position</h2>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-heading font-semibold">Vote Results by Position</h2>
        <Select
          value={selectedPosition?.toString()}
          onValueChange={(value) => setSelectedPosition(Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {positionsQuery.data?.map((position: Position) => (
              <SelectItem key={position.id} value={position.id.toString()}>
                {position.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-neutral-400">
          <p>No votes recorded for this position</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`${value} votes`, 'Votes']}
                labelFormatter={(value) => `Candidate: ${value}`}
              />
              <Bar dataKey="votes" fill="#3f51b5">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
