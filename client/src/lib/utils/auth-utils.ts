/**
 * Utility functions for authentication related operations
 */

import { User } from "@shared/schema";

/**
 * Check if a user has a specific role
 * @param user The user object to check
 * @param requiredRole The role required
 * @returns Boolean indicating if the user has the required role
 */
export function hasRole(user: User | null, requiredRole: 'admin' | 'student'): boolean {
  if (!user) return false;
  return user.role === requiredRole;
}

/**
 * Format user information for display
 * @param user The user object
 * @returns A formatted string with user information
 */
export function formatUserInfo(user: User | null): string {
  if (!user) return '';
  return `${user.fullName} (${user.username})`;
}

/**
 * Get user initials from full name
 * @param fullName The user's full name
 * @returns String with the user's initials
 */
export function getUserInitials(fullName: string | undefined): string {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .map(name => name[0])
    .join("")
    .toUpperCase();
}

/**
 * Check if the user has voted for a specific position
 * @param userVotes Array of user votes
 * @param positionId The position ID to check
 * @returns Boolean indicating if the user has voted for the position
 */
export function hasVotedForPosition(userVotes: any[] | undefined, positionId: number): boolean {
  if (!userVotes) return false;
  return userVotes.some(vote => vote.positionId === positionId);
}

/**
 * Calculate voting stats
 * @param votedPositions Array of positions voted for
 * @param totalPositions Total number of positions
 * @returns Object with statistics about voting progress
 */
export function calculateVotingStats(votedPositions: any[], totalPositions: number) {
  const votedCount = votedPositions.length;
  const percentage = totalPositions > 0 ? Math.round((votedCount / totalPositions) * 100) : 0;
  const remainingCount = totalPositions - votedCount;
  
  return {
    votedCount,
    remainingCount,
    percentage,
    isComplete: percentage === 100
  };
}
