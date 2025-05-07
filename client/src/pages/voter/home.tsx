import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import VoterLayout from "@/components/voter/voter-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import VotingProgress from "@/components/ui/voting-progress";

export default function VoterHome() {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  
  // Query for positions
  const { data: positions } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
  // Query for user's votes
  const { data: userVotes } = useQuery({
    queryKey: ["/api/my-votes"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch user votes");
      return response.json();
    },
  });
  
  // Calculate time remaining (mock election end date)
  useEffect(() => {
    const electionEnd = new Date();
    electionEnd.setDate(electionEnd.getDate() + 5); // Mock: Election ends in 5 days
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = electionEnd.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Election has ended");
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${days} days, ${hours} hours, ${minutes} minutes`);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate voting status
  const getVotingStatus = () => {
    if (!positions || !userVotes) return { votedPositions: [], remainingPositions: [] };
    
    const votedPositionIds = userVotes.map((vote: any) => vote.positionId);
    const allPositions = positions.positions || [];
    
    const votedPositions = allPositions.filter((pos: any) => 
      votedPositionIds.includes(pos.id)
    );
    
    const remainingPositions = allPositions.filter((pos: any) => 
      !votedPositionIds.includes(pos.id)
    );
    
    return { votedPositions, remainingPositions };
  };
  
  const { votedPositions, remainingPositions } = getVotingStatus();
  
  return (
    <VoterLayout>
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="bg-white p-6 shadow">
          <CardContent className="p-0">
            <div className="border-b border-neutral-200 pb-5">
              <h2 className="text-2xl font-bold leading-7 text-neutral-900">
                Welcome, {user?.fullName}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Student ID: {user?.username} {user?.department && `| ${user.department}`}
              </p>
            </div>
            
            <div className="mt-6">
              <div className="overflow-hidden bg-white sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-neutral-900">Election Status</h3>
                  <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                    Current election progress and your voting status.
                  </p>
                </div>
                <div className="border-t border-neutral-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-neutral-200">
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-neutral-500">Election period</dt>
                      <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                        {new Date().toLocaleDateString()} - {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-neutral-500">Time remaining</dt>
                      <dd className="mt-1 text-sm font-medium text-neutral-900 sm:col-span-2 sm:mt-0">
                        {timeRemaining}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-neutral-500">Your voting status</dt>
                      <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          positions && userVotes && userVotes.length === positions.positions?.length
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {userVotes ? `${userVotes.length} of ${positions?.positions?.length || 0} Positions Voted` : "Loading..."}
                        </span>
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-neutral-500">Positions voted</dt>
                      <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                        {votedPositions.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {votedPositions.map((position: any) => (
                              <li key={position.id}>{position.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>You haven't voted for any positions yet.</p>
                        )}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-neutral-500">Positions remaining</dt>
                      <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                        {remainingPositions.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {remainingPositions.map((position: any) => (
                              <li key={position.id}>{position.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>You've voted for all available positions.</p>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Link href="/ballot">
                <Button>
                  {remainingPositions.length > 0 ? "Continue Voting" : "View Ballot"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Voting Progress Card */}
        <VotingProgress 
          votedPositions={votedPositions} 
          totalPositions={positions?.positions?.length || 0}
        />
        
        {/* Election Overview */}
        <Card className="bg-white p-6 shadow">
          <CardContent className="p-0">
            <div className="border-b border-neutral-200 pb-5">
              <h3 className="text-lg font-medium leading-6 text-neutral-900">Current Election Overview</h3>
              <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                A summary of positions and candidates in this election.
              </p>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {positions?.positions?.map((position: any) => (
                <div key={position.id} className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-base font-medium text-neutral-900">{position.name}</h4>
                    <p className="mt-1 text-sm text-neutral-500">
                      {/* This would ideally be fetched from the API with a count of candidates per position */}
                      View candidates
                    </p>
                    <div className="mt-4">
                      <Link href={`/candidates?position=${position.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        View all candidates <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </VoterLayout>
  );
}
