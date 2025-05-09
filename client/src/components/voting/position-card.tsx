import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CandidateItem } from "./candidate-item";
import { Position, Candidate } from "@shared/schema";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

interface PositionCardProps {
  position: Position;
  candidates: Candidate[];
}

export function PositionCard({ position, candidates }: PositionCardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const { toast } = useToast();

  // Check if user has already voted for this position
  const { data: voteStatus, isLoading: checkingVote } = useQuery({
    queryKey: ["/api/student/votes/check", position.id],
    queryFn: async () => {
      const res = await fetch(`/api/student/votes/check/${position.id}`);
      if (!res.ok) throw new Error("Failed to check vote status");
      return res.json();
    },
  });

  const hasVoted = voteStatus?.hasVoted;

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCandidate) {
        throw new Error("No candidate selected");
      }
      return apiRequest("POST", "/api/student/vote", {
        candidateId: selectedCandidate,
        positionId: position.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/student/votes/check", position.id],
      });
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectCandidate = (candidateId: number) => {
    setSelectedCandidate(candidateId);
  };

  const handleSubmitVote = () => {
    if (!selectedCandidate) {
      toast({
        title: "No candidate selected",
        description: "Please select a candidate before submitting your vote.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate();
  };

  if (checkingVote) {
    return (
      <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6 animate-pulse">
        <div className="bg-primary/5 p-4 border-b border-primary/10">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="bg-primary/5 p-4 border-b border-primary/10">
        <h3 className="text-lg font-heading font-semibold text-neutral-800">
          {position.name}
        </h3>
        <p className="text-neutral-600 text-sm">{position.description}</p>
      </div>

      {hasVoted ? (
        <div className="p-4 bg-neutral-50">
          <div className="text-center py-8">
            <div className="bg-success/10 text-success rounded-full p-3 inline-block mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-medium text-neutral-900 mb-1">
              You have already voted for this position
            </h4>
            <p className="text-neutral-600">
              Your vote has been recorded and cannot be changed.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4">
            {candidates.length === 0 ? (
              <div className="text-center py-6 text-neutral-500">
                No candidates available for this position.
              </div>
            ) : (
              candidates.map((candidate) => (
                <CandidateItem
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidate === candidate.id}
                  onSelect={() => handleSelectCandidate(candidate.id)}
                />
              ))
            )}
          </div>

          <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-end">
            <Button
              className="bg-primary hover:bg-primary-dark text-white font-medium"
              onClick={handleSubmitVote}
              disabled={voteMutation.isPending || candidates.length === 0}
            >
              {voteMutation.isPending ? "Submitting..." : "Submit Vote"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
