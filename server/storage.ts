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

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Department methods
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, dept: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Course methods
  getCourses(): Promise<Course[]>;
  getCoursesByDepartment(departmentId: number): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Level methods
  getLevels(): Promise<Level[]>;
  getLevel(id: number): Promise<Level | undefined>;
  createLevel(level: InsertLevel): Promise<Level>;

  // Student methods
  getStudents(): Promise<Student[]>;
  getStudentById(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;

  // Verified Student ID methods
  getVerifiedStudentIds(): Promise<VerifiedStudentId[]>;
  getVerifiedStudentId(studentId: string): Promise<VerifiedStudentId | undefined>;
  createVerifiedStudentId(id: InsertVerifiedStudentId): Promise<VerifiedStudentId>;
  markVerifiedStudentIdAsRegistered(studentId: string): Promise<VerifiedStudentId | undefined>;
  bulkCreateVerifiedStudentIds(ids: string[]): Promise<number>;

  // Position methods
  getPositions(): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;

  // Candidate methods
  getCandidates(): Promise<Candidate[]>;
  getCandidatesByPosition(positionId: number): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: number): Promise<boolean>;

  // Vote methods
  getVotes(): Promise<Vote[]>;
  getVotesByPosition(positionId: number): Promise<Vote[]>;
  getVotesByStudent(studentId: number): Promise<Vote[]>;
  hasStudentVotedForPosition(studentId: number, positionId: number): Promise<boolean>;
  createVote(vote: InsertVote): Promise<Vote>;
  getVotesCountByPosition(positionId: number): Promise<Array<{candidateId: number, count: number}>>;
  getVotingStatsByDepartment(): Promise<Array<{departmentId: number, departmentName: string, percentage: number}>>;

  // Election methods
  getElections(): Promise<Election[]>;
  getElection(id: number): Promise<Election | undefined>;
  getActiveElections(): Promise<Election[]>;
  createElection(election: InsertElection): Promise<Election>;
  updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined>;
  updateElectionStatus(id: number, status: string): Promise<Election | undefined>;
  deleteElection(id: number): Promise<boolean>;
  getElectionPositions(electionId: number): Promise<Position[]>;
  addPositionToElection(electionPosition: InsertElectionPosition): Promise<ElectionPosition>;
  removePositionFromElection(electionId: number, positionId: number): Promise<boolean>;

  // Settings methods
  getSetting(key: string): Promise<string | undefined>;
  getSettings(): Promise<Setting[]>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  resetVotes(): Promise<boolean>;

  // Statistics
  getStats(): Promise<{
    registeredStudents: number;
    activePositions: number;
    candidates: number;
    votesCast: number;
  }>;

  // Required for auth sessions
  sessionStore: any; // Using any for session store due to type issues
}

export class MemStorage implements IStorage {
  private userStore: Map<number, User>;
  private departmentStore: Map<number, Department>;
  private courseStore: Map<number, Course>;
  private levelStore: Map<number, Level>;
  private studentStore: Map<number, Student>;
  private verifiedStudentIdStore: Map<string, VerifiedStudentId>;
  private positionStore: Map<number, Position>;
  private candidateStore: Map<number, Candidate>;
  private voteStore: Map<number, Vote>;
  private electionStore: Map<number, Election>;
  private electionPositionStore: Map<number, ElectionPosition>;
  private settingStore: Map<string, Setting>;
  
  private userIdCounter: number;
  private departmentIdCounter: number;
  private courseIdCounter: number;
  private levelIdCounter: number;
  private studentIdCounter: number;
  private verifiedStudentIdCounter: number;
  private positionIdCounter: number;
  private candidateIdCounter: number;
  private voteIdCounter: number;
  private electionIdCounter: number;
  private electionPositionIdCounter: number;
  private settingIdCounter: number;
  
  sessionStore: any; // Using any for session store due to type issues

  constructor() {
    this.userStore = new Map();
    this.departmentStore = new Map();
    this.courseStore = new Map();
    this.levelStore = new Map();
    this.studentStore = new Map();
    this.verifiedStudentIdStore = new Map();
    this.positionStore = new Map();
    this.candidateStore = new Map();
    this.voteStore = new Map();
    this.electionStore = new Map();
    this.electionPositionStore = new Map();
    this.settingStore = new Map();
    
    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.courseIdCounter = 1;
    this.levelIdCounter = 1;
    this.studentIdCounter = 1;
    this.verifiedStudentIdCounter = 1;
    this.positionIdCounter = 1;
    this.candidateIdCounter = 1;
    this.voteIdCounter = 1;
    this.electionIdCounter = 1;
    this.electionPositionIdCounter = 1;
    this.settingIdCounter = 1;
    
    // Initialize default settings
    this.updateSetting('votingEnabled', 'true');
    this.updateSetting('registrationEnabled', 'true');
    this.updateSetting('resultsVisible', 'true');
    
    // Initialize default admin user
    this.createUser({
      username: 'admin',
      password: 'password', // Will be hashed in the auth module
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: UserRole.ADMIN
    });
    
    // Initialize levels
    this.createLevel({ level: 3 });
    this.createLevel({ level: 4 });
    this.createLevel({ level: 5 });
    this.createLevel({ level: 6 });
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure role is provided
    const data = { ...insertUser, role: insertUser.role || UserRole.STUDENT };
    const user: User = { ...data, id };
    this.userStore.set(id, user);
    return user;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departmentStore.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departmentStore.get(id);
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const department: Department = { ...dept, id };
    this.departmentStore.set(id, department);
    return department;
  }

  async updateDepartment(id: number, dept: Partial<InsertDepartment>): Promise<Department | undefined> {
    const existingDepartment = this.departmentStore.get(id);
    if (!existingDepartment) return undefined;
    
    const updatedDepartment = { ...existingDepartment, ...dept };
    this.departmentStore.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    // Cannot delete if courses are associated
    const hasAssociatedCourses = Array.from(this.courseStore.values()).some(
      (course) => course.departmentId === id
    );
    
    if (hasAssociatedCourses) return false;
    
    return this.departmentStore.delete(id);
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courseStore.values());
  }

  async getCoursesByDepartment(departmentId: number): Promise<Course[]> {
    return Array.from(this.courseStore.values()).filter(
      (course) => course.departmentId === departmentId
    );
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courseStore.get(id);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const newCourse: Course = { ...course, id };
    this.courseStore.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existingCourse = this.courseStore.get(id);
    if (!existingCourse) return undefined;
    
    const updatedCourse = { ...existingCourse, ...course };
    this.courseStore.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    // Cannot delete if students are associated
    const hasAssociatedStudents = Array.from(this.studentStore.values()).some(
      (student) => student.courseId === id
    );
    
    if (hasAssociatedStudents) return false;
    
    return this.courseStore.delete(id);
  }

  // Level methods
  async getLevels(): Promise<Level[]> {
    return Array.from(this.levelStore.values());
  }

  async getLevel(id: number): Promise<Level | undefined> {
    return this.levelStore.get(id);
  }

  async createLevel(level: InsertLevel): Promise<Level> {
    const id = this.levelIdCounter++;
    const newLevel: Level = { ...level, id };
    this.levelStore.set(id, newLevel);
    return newLevel;
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.studentStore.values());
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    return this.studentStore.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.studentStore.values()).find(
      (student) => student.studentId === studentId
    );
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const newStudent: Student = { ...student, id };
    this.studentStore.set(id, newStudent);
    
    // Mark the student ID as registered
    await this.markVerifiedStudentIdAsRegistered(student.studentId);
    
    return newStudent;
  }

  // Verified Student ID methods
  async getVerifiedStudentIds(): Promise<VerifiedStudentId[]> {
    return Array.from(this.verifiedStudentIdStore.values());
  }

  async getVerifiedStudentId(studentId: string): Promise<VerifiedStudentId | undefined> {
    return this.verifiedStudentIdStore.get(studentId);
  }

  async createVerifiedStudentId(id: InsertVerifiedStudentId): Promise<VerifiedStudentId> {
    const numericId = this.verifiedStudentIdCounter++;
    // Make sure isRegistered is provided
    const data = { ...id, isRegistered: id.isRegistered ?? false };
    const verifiedId: VerifiedStudentId = { ...data, id: numericId };
    this.verifiedStudentIdStore.set(id.studentId, verifiedId);
    return verifiedId;
  }

  async markVerifiedStudentIdAsRegistered(studentId: string): Promise<VerifiedStudentId | undefined> {
    const verifiedId = this.verifiedStudentIdStore.get(studentId);
    if (!verifiedId) return undefined;
    
    verifiedId.isRegistered = true;
    this.verifiedStudentIdStore.set(studentId, verifiedId);
    return verifiedId;
  }

  async bulkCreateVerifiedStudentIds(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (!this.verifiedStudentIdStore.has(id)) {
        await this.createVerifiedStudentId({ studentId: id, isRegistered: false });
        count++;
      }
    }
    return count;
  }

  // Position methods
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positionStore.values());
  }

  async getPosition(id: number): Promise<Position | undefined> {
    return this.positionStore.get(id);
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const id = this.positionIdCounter++;
    const newPosition: Position = { ...position, id };
    this.positionStore.set(id, newPosition);
    return newPosition;
  }

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const existingPosition = this.positionStore.get(id);
    if (!existingPosition) return undefined;
    
    const updatedPosition = { ...existingPosition, ...position };
    this.positionStore.set(id, updatedPosition);
    return updatedPosition;
  }

  async deletePosition(id: number): Promise<boolean> {
    // Cannot delete if candidates are associated
    const hasAssociatedCandidates = Array.from(this.candidateStore.values()).some(
      (candidate) => candidate.positionId === id
    );
    
    if (hasAssociatedCandidates) return false;
    
    return this.positionStore.delete(id);
  }

  // Candidate methods
  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidateStore.values());
  }

  async getCandidatesByPosition(positionId: number): Promise<Candidate[]> {
    return Array.from(this.candidateStore.values()).filter(
      (candidate) => candidate.positionId === positionId
    );
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidateStore.get(id);
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    // Check if student is already a candidate for this position
    const existingCandidate = Array.from(this.candidateStore.values()).find(
      (c) => c.studentId === candidate.studentId && c.positionId === candidate.positionId
    );
    
    if (existingCandidate) {
      throw new Error("Student is already a candidate for this position");
    }
    
    const id = this.candidateIdCounter++;
    const newCandidate: Candidate = { ...candidate, id };
    this.candidateStore.set(id, newCandidate);
    return newCandidate;
  }

  async updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const existingCandidate = this.candidateStore.get(id);
    if (!existingCandidate) return undefined;
    
    const updatedCandidate = { ...existingCandidate, ...candidate };
    this.candidateStore.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    // Cannot delete if votes are associated
    const hasAssociatedVotes = Array.from(this.voteStore.values()).some(
      (vote) => vote.candidateId === id
    );
    
    if (hasAssociatedVotes) return false;
    
    return this.candidateStore.delete(id);
  }

  // Vote methods
  async getVotes(): Promise<Vote[]> {
    return Array.from(this.voteStore.values());
  }

  async getVotesByPosition(positionId: number): Promise<Vote[]> {
    return Array.from(this.voteStore.values()).filter(
      (vote) => vote.positionId === positionId
    );
  }

  async getVotesByStudent(studentId: number): Promise<Vote[]> {
    return Array.from(this.voteStore.values()).filter(
      (vote) => vote.studentId === studentId
    );
  }

  async hasStudentVotedForPosition(studentId: number, positionId: number): Promise<boolean> {
    return Array.from(this.voteStore.values()).some(
      (vote) => vote.studentId === studentId && vote.positionId === positionId
    );
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    // Check if student has already voted for this position
    const hasVoted = await this.hasStudentVotedForPosition(vote.studentId, vote.positionId);
    if (hasVoted) {
      throw new Error("Student has already voted for this position");
    }
    
    const id = this.voteIdCounter++;
    const newVote: Vote = { ...vote, id, timestamp: new Date() };
    this.voteStore.set(id, newVote);
    return newVote;
  }

  async getVotesCountByPosition(positionId: number): Promise<Array<{candidateId: number, count: number}>> {
    const votes = await this.getVotesByPosition(positionId);
    
    // Group votes by candidateId and count them
    const voteCounts = new Map<number, number>();
    for (const vote of votes) {
      const currentCount = voteCounts.get(vote.candidateId) || 0;
      voteCounts.set(vote.candidateId, currentCount + 1);
    }
    
    // Convert to array of objects
    return Array.from(voteCounts.entries()).map(([candidateId, count]) => ({
      candidateId,
      count
    }));
  }

  async getVotingStatsByDepartment(): Promise<Array<{departmentId: number, departmentName: string, percentage: number}>> {
    const departments = await this.getDepartments();
    const students = await this.getStudents();
    const votes = await this.getVotes();
    
    const result = [];
    
    for (const department of departments) {
      // Count students in this department
      const departmentStudents = students.filter(s => s.departmentId === department.id);
      const totalStudents = departmentStudents.length;
      
      if (totalStudents === 0) continue;
      
      // Count distinct students who have voted
      const departmentStudentIds = departmentStudents.map(s => s.id);
      const votedStudentIds = new Set(
        votes
          .filter(v => departmentStudentIds.includes(v.studentId))
          .map(v => v.studentId)
      );
      
      const votedCount = votedStudentIds.size;
      const percentage = Math.round((votedCount / totalStudents) * 100);
      
      result.push({
        departmentId: department.id,
        departmentName: department.name,
        percentage
      });
    }
    
    return result;
  }

  // Election methods
  async getElections(): Promise<Election[]> {
    return Array.from(this.electionStore.values());
  }

  async getElection(id: number): Promise<Election | undefined> {
    return this.electionStore.get(id);
  }

  async getActiveElections(): Promise<Election[]> {
    const now = new Date();
    return Array.from(this.electionStore.values()).filter(
      (election) => 
        election.status === ElectionStatus.ACTIVE ||
        (election.status === ElectionStatus.UPCOMING && 
         new Date(election.startDate) <= now && 
         new Date(election.endDate) >= now)
    );
  }

  async createElection(election: InsertElection): Promise<Election> {
    const id = this.electionIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newElection: Election = { 
      ...election, 
      id, 
      createdAt, 
      updatedAt,
      positions: election.positions || []
    };
    this.electionStore.set(id, newElection);
    return newElection;
  }

  async updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined> {
    const existingElection = this.electionStore.get(id);
    if (!existingElection) return undefined;
    
    const updatedElection = { 
      ...existingElection, 
      ...election, 
      updatedAt: new Date() 
    };
    this.electionStore.set(id, updatedElection);
    return updatedElection;
  }

  async updateElectionStatus(id: number, status: string): Promise<Election | undefined> {
    return this.updateElection(id, { status });
  }

  async deleteElection(id: number): Promise<boolean> {
    // Delete associated election positions first
    const electionPositions = Array.from(this.electionPositionStore.values()).filter(
      (ep) => ep.electionId === id
    );
    
    for (const ep of electionPositions) {
      this.electionPositionStore.delete(ep.id);
    }
    
    return this.electionStore.delete(id);
  }

  async getElectionPositions(electionId: number): Promise<Position[]> {
    const electionPositionIds = Array.from(this.electionPositionStore.values())
      .filter((ep) => ep.electionId === electionId)
      .map((ep) => ep.positionId);
    
    return Array.from(this.positionStore.values()).filter(
      (position) => electionPositionIds.includes(position.id)
    );
  }

  async addPositionToElection(electionPosition: InsertElectionPosition): Promise<ElectionPosition> {
    // Check if this position is already in the election
    const exists = Array.from(this.electionPositionStore.values()).some(
      (ep) => ep.electionId === electionPosition.electionId && 
              ep.positionId === electionPosition.positionId
    );
    
    if (exists) {
      throw new Error("Position is already in this election");
    }
    
    const id = this.electionPositionIdCounter++;
    const newElectionPosition: ElectionPosition = { ...electionPosition, id };
    this.electionPositionStore.set(id, newElectionPosition);
    
    // Also update the positions array in the election
    const election = this.electionStore.get(electionPosition.electionId);
    if (election) {
      const positions = Array.isArray(election.positions) ? [...election.positions] : [];
      if (!positions.includes(electionPosition.positionId)) {
        positions.push(electionPosition.positionId);
        election.positions = positions;
        this.electionStore.set(election.id, election);
      }
    }
    
    return newElectionPosition;
  }

  async removePositionFromElection(electionId: number, positionId: number): Promise<boolean> {
    const electionPosition = Array.from(this.electionPositionStore.values()).find(
      (ep) => ep.electionId === electionId && ep.positionId === positionId
    );
    
    if (!electionPosition) return false;
    
    // Remove from election positions table
    const result = this.electionPositionStore.delete(electionPosition.id);
    
    // Also update the positions array in the election
    const election = this.electionStore.get(electionId);
    if (election && result) {
      const positions = Array.isArray(election.positions) ? [...election.positions] : [];
      election.positions = positions.filter(id => id !== positionId);
      this.electionStore.set(election.id, election);
    }
    
    return result;
  }

  // Settings methods
  async getSetting(key: string): Promise<string | undefined> {
    const setting = Array.from(this.settingStore.values()).find(
      (s) => s.key === key
    );
    return setting?.value;
  }

  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settingStore.values());
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    // Find existing setting
    let setting = Array.from(this.settingStore.values()).find(
      (s) => s.key === key
    );
    
    if (setting) {
      // Update existing setting
      setting.value = value;
      this.settingStore.set(key, setting);
    } else {
      // Create new setting
      const id = this.settingIdCounter++;
      setting = { id, key, value };
      this.settingStore.set(key, setting);
    }
    
    return setting;
  }

  async resetVotes(): Promise<boolean> {
    // Clear votes store
    this.voteStore.clear();
    this.voteIdCounter = 1;
    return true;
  }

  async getStats(): Promise<{
    registeredStudents: number;
    activePositions: number;
    candidates: number;
    votesCast: number;
  }> {
    return {
      registeredStudents: this.studentStore.size,
      activePositions: this.positionStore.size,
      candidates: this.candidateStore.size,
      votesCast: this.voteStore.size
    };
  }
}

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

export const storage = new MemStorage();