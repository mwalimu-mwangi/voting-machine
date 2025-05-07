import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import VoterLayout from "@/components/voter/voter-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import VotingProgress from "@/components/ui/voting-progress";

export default function VoterBallot() {
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  
  // Query for positions
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
  // Query for user's votes
  const { data: userVotes, isLoading: votesLoading } = useQuery({
    queryKey: ["/api/my-votes"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch user votes");
      return response.json();
    },
  });
  
  // Query for candidates for the selected position
  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ["/api/candidates", selectedPosition],
    queryFn: async ({ queryKey }) => {
      const [endpoint, positionId] = queryKey;
      const response = await fetch(`${endpoint}?positionId=${positionId}`);
      if (!response.ok) throw new Error("Failed to fetch candidates");
      return response.json();
    },
    enabled: !!selectedPosition,
  });
  
  // Cast vote mutation
  const castVoteMutation = useMutation({
    mutationFn: async ({ positionId, candidateId }: { positionId: number, candidateId: number }) => {
      const response = await apiRequest("POST", "/api/vote", { positionId, candidateId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote Cast",
        description: "Your vote has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-votes"] });
      setSelectedCandidate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Vote Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Find the first unvoted position when the component loads
  useEffect(() => {
    if (positions && userVotes && !selectedPosition) {
      const votedPositionIds = userVotes.map((vote: any) => vote.positionId);
      const unvotedPosition = positions.positions?.find((pos: any) => 
        !votedPositionIds.includes(pos.id)
      );
      
      if (unvotedPosition) {
        setSelectedPosition(String(unvotedPosition.id));
      } else if (positions.positions?.length > 0) {
        // If all are voted, select the first position
        setSelectedPosition(String(positions.positions[0].id));
      }
    }
  }, [positions, userVotes, selectedPosition]);
  
  // Handle position change
  const handlePositionChange = (positionId: string) => {
    setSelectedPosition(positionId);
    setSelectedCandidate(null);
  };
  
  // Handle candidate selection
  const handleCandidateChange = (candidateId: string) => {
    setSelectedCandidate(candidateId);
  };
  
  // Handle vote submission
  const handleCastVote = () => {
    if (!selectedPosition || !selectedCandidate) return;
    
    castVoteMutation.mutate({
      positionId: parseInt(selectedPosition),
      candidateId: parseInt(selectedCandidate)
    });
  };
  
  // Check if a position has been voted for
  const hasVotedForPosition = (positionId: number) => {
    if (!userVotes) return false;
    return userVotes.some((vote: any) => vote.positionId === positionId);
  };
  
  // Get all voted positions
  const getVotedPositions = () => {
    if (!positions || !userVotes) return [];
    
    const votedPositionIds = userVotes.map((vote: any) => vote.positionId);
    return positions.positions?.filter((pos: any) => 
      votedPositionIds.includes(pos.id)
    ) || [];
  };
  
  const votedPositions = getVotedPositions();
  
  // Loading state
  if (positionsLoading || votesLoading) {
    return (
      <VoterLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </VoterLayout>
    );
  }
  
  return (
    <VoterLayout>
      <div className="space-y-6">
        {/* Ballot Card */}
        <Card className="bg-white p-6 shadow">
          <CardContent className="p-0">
            <div className="border-b border-neutral-200 pb-5">
              <h2 className="text-2xl font-bold leading-7 text-neutral-900">Your Ballot</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Cast your vote for each available position
              </p>
            </div>
            
            {/* Ballot Tabs */}
            {positions?.positions?.length > 0 ? (
              <div className="mt-6">
                <Tabs 
                  value={selectedPosition || undefined} 
                  onValueChange={handlePositionChange}
                >
                  <div className="border-b border-neutral-200">
                    <TabsList className="h-auto">
                      {positions.positions.map((position: any) => {
                        const isVoted = hasVotedForPosition(position.id);
                        return (
                          <TabsTrigger 
                            key={position.id} 
                            value={String(position.id)}
                            className={`border-b-2 border-transparent py-4 px-1 text-sm font-medium ${
                              isVoted ? 'text-neutral-400' : 'text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                            }`}
                            disabled={isVoted}
                          >
                            {position.name} 
                            {isVoted && <CheckCircle2 className="ml-1 h-4 w-4 text-green-500" />}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>
                  
                  {positions.positions.map((position: any) => (
                    <TabsContent key={position.id} value={String(position.id)}>
                      {hasVotedForPosition(position.id) ? (
                        <div className="p-8 text-center">
                          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                          <h3 className="mt-2 text-lg font-medium text-neutral-900">
                            You've already voted for {position.name}
                          </h3>
                          <p className="mt-1 text-sm text-neutral-500">
                            Your vote has been recorded. You can view the results once the election ends.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium text-neutral-900">
                            {position.name} Candidates
                          </h3>
                          <p className="mt-1 text-sm text-neutral-500">
                            Please select one candidate for the position of {position.name}
                          </p>
                          
                          {candidatesLoading ? (
                            <div className="flex justify-center p-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : candidates?.candidates?.length > 0 ? (
                            <div className="mt-4 space-y-4">
                              <RadioGroup value={selectedCandidate || ""} onValueChange={handleCandidateChange}>
                                {candidates.candidates.map((candidate: any) => (
                                  <div 
                                    key={candidate.id} 
                                    className="relative flex items-start bg-white p-4 rounded-lg border border-neutral-200 hover:border-primary-400"
                                  >
                                    <div className="flex h-5 items-center">
                                      <RadioGroupItem 
                                        id={`candidate-${candidate.id}`} 
                                        value={String(candidate.id)} 
                                      />
                                    </div>
                                    <div className="ml-3 flex-grow text-sm">
                                      <Label 
                                        htmlFor={`candidate-${candidate.id}`}
                                        className="font-medium text-neutral-900"
                                      >
                                        {candidate.name}
                                      </Label>
                                      <p className="text-neutral-500">
                                        {candidate.year}, {candidate.department}
                                      </p>
                                      <p className="text-neutral-500 mt-2">
                                        Platform: {candidate.platform || "No platform provided"}
                                      </p>
                                      {candidate.bio && (
                                        <p className="mt-2 text-sm text-primary-600">
                                          {candidate.bio}
                                        </p>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <span className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold">
                                        {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </RadioGroup>
                              
                              <div className="mt-8 flex justify-end space-x-3">
                                <Button 
                                  variant="outline"
                                  onClick={() => setSelectedCandidate(null)}
                                  disabled={!selectedCandidate}
                                >
                                  Clear selection
                                </Button>
                                <Button 
                                  onClick={handleCastVote}
                                  disabled={!selectedCandidate || castVoteMutation.isPending}
                                >
                                  {castVoteMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    `Cast Vote for ${position.name}`
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-8 text-neutral-500">
                              No candidates available for this position.
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <div className="text-center p-8 text-neutral-500">
                No positions available for voting.
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Voting Progress */}
        <VotingProgress 
          votedPositions={votedPositions} 
          totalPositions={positions?.positions?.length || 0}
        />
      </div>
    </VoterLayout>
  );
}
