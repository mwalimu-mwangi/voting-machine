import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

export interface Position {
  id: number;
  name: string;
  hasVoted: boolean;
}

interface VotingProgressProps {
  positions: Position[];
  total: number;
  voted: number;
  percentage: number;
}

export function VotingProgress({ positions, total, voted, percentage }: VotingProgressProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Voting Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="primary">
              {voted} of {total} Positions
            </Badge>
            <span className="text-sm font-semibold text-primary">{percentage}%</span>
          </div>
          
          <Progress value={percentage} className="h-2" />
          
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {positions.map((position) => (
              <div
                key={position.id}
                className={`rounded-md p-3 text-center ${
                  position.hasVoted
                    ? "bg-green-50"
                    : "bg-neutral-50"
                }`}
              >
                <h4 className="text-sm font-medium text-neutral-800">{position.name}</h4>
                <p className="mt-1 flex items-center justify-center text-xs">
                  {position.hasVoted ? (
                    <>
                      <span className="text-green-600 mr-1">Voted</span>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </>
                  ) : (
                    <span className="text-neutral-500">Not voted</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
