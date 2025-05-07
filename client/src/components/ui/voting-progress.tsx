import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface VotingProgressProps {
  votedPositions: any[];
  totalPositions: number;
}

export default function VotingProgress({ votedPositions, totalPositions }: VotingProgressProps) {
  // Calculate percentage of completed votes
  const percentage = totalPositions > 0
    ? Math.round((votedPositions.length / totalPositions) * 100)
    : 0;
  
  // Determine status text and color for each position
  const getPositionStatusClassName = (isVoted: boolean) => {
    return isVoted
      ? "bg-green-50 text-green-800"
      : "bg-neutral-50 text-neutral-800";
  };
  
  return (
    <Card className="bg-white p-6 shadow">
      <CardContent className="p-0">
        <h3 className="text-lg font-medium text-neutral-900">Your Voting Progress</h3>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-primary-100 px-2 text-xs font-semibold text-primary-800">
                  {votedPositions.length} of {totalPositions} Positions
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-primary-600">{percentage}%</span>
              </div>
            </div>
            <div className="mb-4 flex h-2 overflow-hidden rounded bg-primary-100 text-xs">
              <div 
                style={{ width: `${percentage}%` }} 
                className="flex flex-col justify-center whitespace-nowrap rounded bg-primary-500 text-center text-white shadow-none"
              ></div>
            </div>
          </div>
          
          {totalPositions > 0 && (
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {votedPositions.map((position) => (
                <div key={position.id} className={`rounded-md ${getPositionStatusClassName(true)} p-3 text-center`}>
                  <h4 className="text-sm font-medium">{position.name}</h4>
                  <p className="mt-1 text-xs flex items-center justify-center">
                    Voted <CheckCircle2 className="ml-1 h-3 w-3" />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
