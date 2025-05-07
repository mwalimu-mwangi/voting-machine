import { db } from "@db";
import { eq, and, or, count, sql, desc } from "drizzle-orm";
import {
  users,
  students,
  positions,
  candidates,
  votes,
  activityLogs,
  elections,
  User,
  Student,
  Position,
  Candidate,
  Vote,
  ActivityLog,
  Election,
  InsertUser,
  InsertStudent,
  InsertPosition,
  InsertCandidate,
  InsertElection,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(userId: number): Promise<void>;
  
  // Student operations
  getStudents(page?: number, pageSize?: number): Promise<{ students: Student[], total: number }>;
  getStudentById(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudentRegistration(studentId: string, userId: number): Promise<void>;
  importStudents(students: InsertStudent[]): Promise<number>;
  
  // Position operations
  getPositions(page?: number, pageSize?: number): Promise<{ positions: Position[], total: number }>;
  getPositionById(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  
  // Candidate operations
  getCandidates(page?: number, pageSize?: number, positionId?: number): Promise<{ candidates: Candidate[], total: number }>;
  getCandidateById(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  
  // Vote operations
  castVote(userId: number, positionId: number, candidateId: number): Promise<Vote>;
  getUserVotes(userId: number): Promise<{ positionId: number; candidateId: number }[]>;
  getResults(): Promise<any[]>;
  getPositionResults(positionId: number): Promise<any[]>;
  
  // Election operations
  getElections(page?: number, pageSize?: number): Promise<{ elections: Election[], total: number }>;
  getElectionById(id: number): Promise<Election | undefined>;
  createElection(election: InsertElection & { createdBy: number }): Promise<Election>;
  updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined>;
  activateElection(id: number): Promise<void>;
  deactivateElection(id: number): Promise<void>;
  completeElection(id: number): Promise<void>;
  
  // Activity log operations
  logActivity(userId: number | null, action: string, details?: string, ipAddress?: string): Promise<ActivityLog>;
  getRecentActivities(limit?: number): Promise<ActivityLog[]>;
  
  // Session storage
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
  }
  
  /* User Operations */
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUserLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: sql`NOW()` })
      .where(eq(users.id, userId));
  }
  
  /* Student Operations */
  async getStudents(page = 1, pageSize = 10): Promise<{ students: Student[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    const studentsData = await db.select().from(students)
      .limit(pageSize)
      .offset(offset);
      
    const [{ value: total }] = await db.select({
      value: count()
    }).from(students);
    
    return { students: studentsData, total: Number(total) };
  }
  
  async getStudentById(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }
  
  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.studentId, studentId)).limit(1);
    return result[0];
  }
  
  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }
  
  async updateStudentRegistration(studentId: string, userId: number): Promise<void> {
    await db.update(students)
      .set({ isRegistered: true, userId: userId })
      .where(eq(students.studentId, studentId));
  }
  
  async importStudents(studentsData: InsertStudent[]): Promise<number> {
    // Filter out any students that already exist with the same student ID
    const existingStudentIds = new Set(
      (await db.select({ id: students.studentId }).from(students))
        .map(s => s.id)
    );
    
    const newStudents = studentsData.filter(s => !existingStudentIds.has(s.studentId));
    
    if (newStudents.length === 0) return 0;
    
    const result = await db.insert(students).values(newStudents).returning();
    return result.length;
  }
  
  /* Position Operations */
  async getPositions(page = 1, pageSize = 10): Promise<{ positions: Position[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    const positionsData = await db.select().from(positions)
      .limit(pageSize)
      .offset(offset);
      
    const [{ value: total }] = await db.select({
      value: count()
    }).from(positions);
    
    return { positions: positionsData, total: Number(total) };
  }
  
  async getPositionById(id: number): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.id, id)).limit(1);
    return result[0];
  }
  
  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }
  
  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const [updatedPosition] = await db.update(positions)
      .set(position)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition;
  }
  
  /* Candidate Operations */
  async getCandidates(page = 1, pageSize = 10, positionId?: number): Promise<{ candidates: Candidate[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    let query = db.select().from(candidates);
    
    if (positionId) {
      query = query.where(eq(candidates.positionId, positionId));
    }
    
    const candidatesData = await query.limit(pageSize).offset(offset);
    
    let countQuery = db.select({
      value: count()
    }).from(candidates);
    
    if (positionId) {
      countQuery = countQuery.where(eq(candidates.positionId, positionId));
    }
    
    const [{ value: total }] = await countQuery;
    
    return { candidates: candidatesData, total: Number(total) };
  }
  
  async getCandidateById(id: number): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
    return result[0];
  }
  
  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidates).values(candidate).returning();
    return newCandidate;
  }
  
  async updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const [updatedCandidate] = await db.update(candidates)
      .set(candidate)
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate;
  }
  
  /* Vote Operations */
  async castVote(userId: number, positionId: number, candidateId: number): Promise<Vote> {
    // Check if user has already voted for this position
    const existingVote = await db.select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.positionId, positionId)
        )
      )
      .limit(1);
    
    if (existingVote.length > 0) {
      throw new Error("You have already voted for this position");
    }
    
    const [newVote] = await db.insert(votes)
      .values({
        userId,
        positionId,
        candidateId
      })
      .returning();
    
    return newVote;
  }
  
  async getUserVotes(userId: number): Promise<{ positionId: number; candidateId: number }[]> {
    const userVotes = await db.select({
      positionId: votes.positionId,
      candidateId: votes.candidateId
    })
    .from(votes)
    .where(eq(votes.userId, userId));
    
    return userVotes;
  }
  
  async getResults(): Promise<any[]> {
    const results = await db.execute(sql`
      SELECT 
        p.id as position_id, 
        p.name as position_name, 
        c.id as candidate_id, 
        c.name as candidate_name,
        c.department,
        c.year,
        COUNT(v.id) as vote_count
      FROM positions p
      LEFT JOIN candidates c ON p.id = c.position_id
      LEFT JOIN votes v ON c.id = v.candidate_id
      WHERE p.is_active = true
      GROUP BY p.id, p.name, c.id, c.name, c.department, c.year
      ORDER BY p.id, vote_count DESC
    `);
    
    return results.rows;
  }
  
  async getPositionResults(positionId: number): Promise<any[]> {
    const results = await db.execute(sql`
      SELECT 
        c.id as candidate_id, 
        c.name as candidate_name,
        c.department,
        c.year,
        COUNT(v.id) as vote_count
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      WHERE c.position_id = ${positionId}
      GROUP BY c.id, c.name, c.department, c.year
      ORDER BY vote_count DESC
    `);
    
    return results.rows;
  }
  
  /* Activity Log Operations */
  async logActivity(userId: number | null, action: string, details?: string, ipAddress?: string): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs)
      .values({
        userId: userId ?? undefined,
        action,
        details,
        ipAddress
      })
      .returning();
    
    return log;
  }
  
  async getRecentActivities(limit = 10): Promise<ActivityLog[]> {
    const logs = await db.select()
      .from(activityLogs)
      .orderBy(sql`${activityLogs.createdAt} DESC`)
      .limit(limit);
    
    return logs;
  }
  
  /* Election Operations */
  async getElections(page = 1, pageSize = 10): Promise<{ elections: Election[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    const electionsData = await db.select().from(elections)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(elections.createdAt));
      
    const [{ value: total }] = await db.select({
      value: count()
    }).from(elections);
    
    return { elections: electionsData, total: Number(total) };
  }
  
  async getElectionById(id: number): Promise<Election | undefined> {
    const result = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
    return result[0];
  }
  
  async createElection(election: InsertElection & { createdBy: number }): Promise<Election> {
    const [newElection] = await db.insert(elections).values(election).returning();
    return newElection;
  }
  
  async updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined> {
    const [updatedElection] = await db.update(elections)
      .set(election)
      .where(eq(elections.id, id))
      .returning();
    return updatedElection;
  }
  
  async activateElection(id: number): Promise<void> {
    // First deactivate all other elections
    await db.update(elections)
      .set({ isActive: false })
      .where(eq(elections.isActive, true));
    
    // Then activate this one
    await db.update(elections)
      .set({ 
        isActive: true,
        isComplete: false
      })
      .where(eq(elections.id, id));
  }
  
  async deactivateElection(id: number): Promise<void> {
    await db.update(elections)
      .set({ isActive: false })
      .where(eq(elections.id, id));
  }
  
  async completeElection(id: number): Promise<void> {
    await db.update(elections)
      .set({ 
        isActive: false,
        isComplete: true 
      })
      .where(eq(elections.id, id));
  }
}

export const storage = new DatabaseStorage();
