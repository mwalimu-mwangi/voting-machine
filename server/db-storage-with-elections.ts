import { 
  User, InsertUser, Department, InsertDepartment, 
  Course, InsertCourse, Level, InsertLevel, 
  Student, InsertStudent, VerifiedStudentId, InsertVerifiedStudentId,
  Position, InsertPosition, Candidate, InsertCandidate,
  Vote, InsertVote, Setting, InsertSetting,
  Election, InsertElection, ElectionPosition, InsertElectionPosition,
  UserRole, ElectionStatus
} from "@shared/schema";

import { 
  users, departments, courses, levels, students, 
  verifiedStudentIds, positions, candidates, votes, elections, electionPositions, settings 
} from "@shared/schema";

import { db, pool } from "./db";
import { eq, and, sql, desc, count } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(dept).returning();
    return department;
  }

  async updateDepartment(id: number, dept: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updatedDepartment] = await db
      .update(departments)
      .set(dept)
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    try {
      await db.delete(departments).where(eq(departments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting department:', error);
      return false;
    }
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async getCoursesByDepartment(departmentId: number): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(eq(courses.departmentId, departmentId))
      .orderBy(courses.name);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [createdCourse] = await db.insert(courses).values(course).returning();
    return createdCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    try {
      await db.delete(courses).where(eq(courses.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      return false;
    }
  }

  // Level methods
  async getLevels(): Promise<Level[]> {
    return db.select().from(levels).orderBy(levels.level);
  }

  async getLevel(id: number): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }

  async createLevel(level: InsertLevel): Promise<Level> {
    const [createdLevel] = await db.insert(levels).values(level).returning();
    return createdLevel;
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [createdStudent] = await db.insert(students).values(student).returning();
    await this.markVerifiedStudentIdAsRegistered(student.studentId);
    return createdStudent;
  }

  // Verified Student ID methods
  async getVerifiedStudentIds(): Promise<VerifiedStudentId[]> {
    return db.select().from(verifiedStudentIds);
  }

  async getVerifiedStudentId(studentId: string): Promise<VerifiedStudentId | undefined> {
    const [id] = await db
      .select()
      .from(verifiedStudentIds)
      .where(eq(verifiedStudentIds.studentId, studentId));
    return id;
  }

  async createVerifiedStudentId(id: InsertVerifiedStudentId): Promise<VerifiedStudentId> {
    const [createdId] = await db.insert(verifiedStudentIds).values(id).returning();
    return createdId;
  }

  async markVerifiedStudentIdAsRegistered(studentId: string): Promise<VerifiedStudentId | undefined> {
    const [updatedId] = await db
      .update(verifiedStudentIds)
      .set({ isRegistered: true })
      .where(eq(verifiedStudentIds.studentId, studentId))
      .returning();
    return updatedId;
  }

  async bulkCreateVerifiedStudentIds(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const existing = await this.getVerifiedStudentId(id);
      if (!existing) {
        await this.createVerifiedStudentId({ studentId: id, isRegistered: false });
        count++;
      }
    }
    return count;
  }

  // Position methods
  async getPositions(): Promise<Position[]> {
    return db.select().from(positions);
  }

  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position;
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [createdPosition] = await db.insert(positions).values(position).returning();
    return createdPosition;
  }

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const [updatedPosition] = await db
      .update(positions)
      .set(position)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition;
  }

  async deletePosition(id: number): Promise<boolean> {
    try {
      await db.delete(positions).where(eq(positions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting position:', error);
      return false;
    }
  }

  // Candidate methods
  async getCandidates(): Promise<Candidate[]> {
    return db.select().from(candidates);
  }

  async getCandidatesByPosition(positionId: number): Promise<Candidate[]> {
    return db.select().from(candidates).where(eq(candidates.positionId, positionId));
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate;
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [createdCandidate] = await db.insert(candidates).values(candidate).returning();
    return createdCandidate;
  }

  async updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set(candidate)
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    try {
      await db.delete(candidates).where(eq(candidates.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting candidate:', error);
      return false;
    }
  }

  // Vote methods
  async getVotes(): Promise<Vote[]> {
    return db.select().from(votes);
  }

  async getVotesByPosition(positionId: number): Promise<Vote[]> {
    return db.select().from(votes).where(eq(votes.positionId, positionId));
  }

  async getVotesByStudent(studentId: number): Promise<Vote[]> {
    return db.select().from(votes).where(eq(votes.studentId, studentId));
  }

  async hasStudentVotedForPosition(studentId: number, positionId: number): Promise<boolean> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.studentId, studentId), eq(votes.positionId, positionId)));
    return !!vote;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [createdVote] = await db.insert(votes).values(vote).returning();
    return createdVote;
  }

  async getVotesCountByPosition(positionId: number): Promise<Array<{ candidateId: number, count: number }>> {
    const results = await db
      .select({
        candidateId: votes.candidateId,
        count: count(votes.id),
      })
      .from(votes)
      .where(eq(votes.positionId, positionId))
      .groupBy(votes.candidateId);
    return results;
  }

  async getVotingStatsByDepartment(): Promise<Array<{ departmentId: number, departmentName: string, percentage: number }>> {
    // This is a complex query that would be more efficiently done in SQL
    // Get all departments
    const depts = await this.getDepartments();
    const results = [];

    for (const dept of depts) {
      // Find students in this department
      const studentsInDept = await db
        .select()
        .from(students)
        .where(eq(students.departmentId, dept.id));

      if (studentsInDept.length === 0) continue;

      // Get student IDs
      const studentIds = studentsInDept.map(s => s.id);

      // Count votes by these students
      const votesQuery = await db
        .select({
          studentId: votes.studentId,
        })
        .from(votes)
        .where(sql`${votes.studentId} IN (${studentIds.join(',')})`)
        .groupBy(votes.studentId);

      const votedCount = votesQuery.length;
      const percentage = Math.round((votedCount / studentsInDept.length) * 100);

      results.push({
        departmentId: dept.id,
        departmentName: dept.name,
        percentage,
      });
    }

    return results;
  }

  // Election methods
  async getElections(): Promise<Election[]> {
    return db.select().from(elections);
  }

  async getElection(id: number): Promise<Election | undefined> {
    const [election] = await db.select().from(elections).where(eq(elections.id, id));
    return election;
  }

  async getActiveElections(): Promise<Election[]> {
    const now = new Date();
    return db
      .select()
      .from(elections)
      .where(
        sql`(${elections.status} = ${ElectionStatus.ACTIVE} OR 
             (${elections.status} = ${ElectionStatus.UPCOMING} AND
              ${elections.startDate} <= ${now} AND
              ${elections.endDate} >= ${now}))`
      );
  }

  async createElection(election: InsertElection): Promise<Election> {
    const [createdElection] = await db.insert(elections).values(election).returning();
    return createdElection;
  }

  async updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined> {
    const [updatedElection] = await db
      .update(elections)
      .set({
        ...election,
        updatedAt: new Date()
      })
      .where(eq(elections.id, id))
      .returning();
    return updatedElection;
  }

  async updateElectionStatus(id: number, status: string): Promise<Election | undefined> {
    return this.updateElection(id, { status });
  }

  async deleteElection(id: number): Promise<boolean> {
    try {
      // Delete associated election positions first
      await db.delete(electionPositions).where(eq(electionPositions.electionId, id));
      // Then delete the election
      await db.delete(elections).where(eq(elections.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting election:', error);
      return false;
    }
  }

  async getElectionPositions(electionId: number): Promise<Position[]> {
    const positionIds = await db
      .select({
        positionId: electionPositions.positionId
      })
      .from(electionPositions)
      .where(eq(electionPositions.electionId, electionId));
    
    if (positionIds.length === 0) return [];
    
    const ids = positionIds.map(p => p.positionId);
    
    return db
      .select()
      .from(positions)
      .where(sql`${positions.id} IN (${ids.join(',')})`);
  }

  async addPositionToElection(electionPosition: InsertElectionPosition): Promise<ElectionPosition> {
    const [createdElectionPosition] = await db
      .insert(electionPositions)
      .values(electionPosition)
      .returning();
    
    // Also update the positions array in the election
    const election = await this.getElection(electionPosition.electionId);
    if (election) {
      const positionsList = Array.isArray(election.positions) ? [...election.positions] : [];
      if (!positionsList.includes(electionPosition.positionId)) {
        positionsList.push(electionPosition.positionId);
        await this.updateElection(election.id, { positions: positionsList });
      }
    }
    
    return createdElectionPosition;
  }

  async removePositionFromElection(electionId: number, positionId: number): Promise<boolean> {
    try {
      await db
        .delete(electionPositions)
        .where(
          and(
            eq(electionPositions.electionId, electionId),
            eq(electionPositions.positionId, positionId)
          )
        );
      
      // Also update the positions array in the election
      const election = await this.getElection(electionId);
      if (election) {
        const positionsList = Array.isArray(election.positions) ? [...election.positions] : [];
        await this.updateElection(
          election.id, 
          { positions: positionsList.filter(id => id !== positionId) }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error removing position from election:', error);
      return false;
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting?.value;
  }

  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      const [updatedSetting] = await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning();
      return updatedSetting;
    } else {
      const [newSetting] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return newSetting;
    }
  }

  async resetVotes(): Promise<boolean> {
    try {
      await db.delete(votes);
      return true;
    } catch (error) {
      console.error('Error resetting votes:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    registeredStudents: number;
    activePositions: number;
    candidates: number;
    votesCast: number;
  }> {
    const [studentsCount] = await db
      .select({
        count: count(students.id),
      })
      .from(students);

    const [positionsCount] = await db
      .select({
        count: count(positions.id),
      })
      .from(positions);

    const [candidatesCount] = await db
      .select({
        count: count(candidates.id),
      })
      .from(candidates);

    const [votesCount] = await db
      .select({
        count: count(votes.id),
      })
      .from(votes);

    return {
      registeredStudents: Number(studentsCount?.count || 0),
      activePositions: Number(positionsCount?.count || 0),
      candidates: Number(candidatesCount?.count || 0),
      votesCast: Number(votesCount?.count || 0),
    };
  }
}