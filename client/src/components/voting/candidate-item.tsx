import { Candidate } from "@shared/schema";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";

interface CandidateItemProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
}

interface StudentData {
  id: number;
  studentId: string;
  departmentId: number;
  courseId: number;
  levelId: number;
  userId: number;
}

interface UserData {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface DepartmentData {
  id: number;
  name: string;
}

interface LevelData {
  id: number;
  level: number;
}

export function CandidateItem({ candidate, isSelected, onSelect }: CandidateItemProps) {
  // Fetch student details for the candidate
  const { data: student } = useQuery<StudentData>({
    queryKey: ["/api/admin/students", candidate.studentId],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch user details if student data is available
  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/admin/users", student?.userId],
    enabled: !!student?.userId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch department details
  const { data: department } = useQuery<DepartmentData>({
    queryKey: ["/api/departments", student?.departmentId],
    enabled: !!student?.departmentId,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch level details
  const { data: level } = useQuery<LevelData>({
    queryKey: ["/api/levels", student?.levelId],
    enabled: !!student?.levelId,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div 
      className={`border rounded-lg p-4 mb-4 cursor-pointer transition ${
        isSelected 
          ? "border-primary/30 bg-primary/5" 
          : "border-neutral-200 hover:border-primary/30 hover:bg-primary/5"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <input 
            type="radio" 
            name={`position-${candidate.positionId}`}
            id={`candidate-${candidate.id}`} 
            className="h-5 w-5 text-primary focus:ring-primary border-neutral-300"
            checked={isSelected}
            onChange={onSelect}
          />
        </div>
        <label 
          htmlFor={`candidate-${candidate.id}`} 
          className="ml-3 flex-1 flex items-center cursor-pointer"
        >
          <div className="flex-shrink-0 mr-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-neutral-900 font-medium">
              {user ? `${user.firstName} ${user.lastName}` : `Candidate ${candidate.id}`}
            </h4>
            <p className="text-neutral-500 text-sm">
              {department?.name || "Department"}, Level {level?.level || ""}
            </p>
            <p className="text-neutral-600 text-sm mt-1">{candidate.manifesto}</p>
          </div>
        </label>
      </div>
    </div>
  );
}
