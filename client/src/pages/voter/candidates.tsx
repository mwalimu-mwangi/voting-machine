import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import VoterLayout from "@/components/voter/voter-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, BookOpen, Award, Briefcase } from "lucide-react";
import { useLocation } from "wouter";

export default function VoterCandidates() {
  const [location] = useLocation();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Parse the position from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const positionId = params.get("position");
    if (positionId) setSelectedPosition(positionId);
  }, [location]);
  
  // Query for positions
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
  // Set default position if none selected
  useEffect(() => {
    if (!selectedPosition && positions?.positions?.length > 0) {
      setSelectedPosition(String(positions.positions[0].id));
    }
  }, [positions, selectedPosition]);
  
  // Query for candidates of the selected position
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
  
  // Query for the position details
  const { data: positionDetails, isLoading: positionLoading } = useQuery({
    queryKey: ["/api/positions", selectedPosition],
    queryFn: async ({ queryKey }) => {
      const [endpoint, positionId] = queryKey;
      const response = await fetch(`${endpoint}/${positionId}`);
      if (!response.ok) throw new Error("Failed to fetch position details");
      return response.json();
    },
    enabled: !!selectedPosition,
  });
  
  // Generate initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };
  
  // Loading state
  if (positionsLoading) {
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
      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>
            View all candidates running for different positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positions?.positions?.length > 0 ? (
            <Tabs 
              value={selectedPosition || undefined}
              onValueChange={setSelectedPosition}
              className="w-full"
            >
              <TabsList className="mb-6 w-full justify-start overflow-auto">
                {positions.positions.map((position: any) => (
                  <TabsTrigger key={position.id} value={String(position.id)}>
                    {position.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {positions.positions.map((position: any) => (
                <TabsContent key={position.id} value={String(position.id)}>
                  {candidatesLoading || positionLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="mb-6 pb-4 border-b border-neutral-200">
                        <h2 className="text-xl font-semibold text-neutral-900">
                          {positionDetails?.name || position.name}
                        </h2>
                        {positionDetails?.description && (
                          <p className="mt-2 text-sm text-neutral-600">
                            {positionDetails.description}
                          </p>
                        )}
                      </div>
                      
                      {candidates?.candidates?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {candidates.candidates.map((candidate: any) => (
                            <Card key={candidate.id} className="overflow-hidden">
                              <div className="p-6">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-16 w-16 border-2 border-primary-50">
                                    <AvatarFallback className="bg-primary-100 text-primary-700">
                                      {getInitials(candidate.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                    <Badge variant="secondary" className="mt-1">
                                      {candidate.year}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="mt-6 space-y-4">
                                  <div className="flex items-start">
                                    <Briefcase className="h-5 w-5 text-neutral-400 mr-2 mt-0.5" />
                                    <div>
                                      <h4 className="text-sm font-medium">Department</h4>
                                      <p className="text-sm text-neutral-600">{candidate.department}</p>
                                    </div>
                                  </div>
                                  
                                  {candidate.bio && (
                                    <div className="flex items-start">
                                      <BookOpen className="h-5 w-5 text-neutral-400 mr-2 mt-0.5" />
                                      <div>
                                        <h4 className="text-sm font-medium">Biography</h4>
                                        <p className="text-sm text-neutral-600">{candidate.bio}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {candidate.platform && (
                                    <div className="flex items-start">
                                      <Award className="h-5 w-5 text-neutral-400 mr-2 mt-0.5" />
                                      <div>
                                        <h4 className="text-sm font-medium">Platform</h4>
                                        <p className="text-sm text-neutral-600">{candidate.platform}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 px-4">
                          <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                            <Award className="h-6 w-6 text-neutral-400" />
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-neutral-900">No candidates</h3>
                          <p className="mt-1 text-sm text-neutral-500">There are no candidates for this position yet.</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              ))}
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
