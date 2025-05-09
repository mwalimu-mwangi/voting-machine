import { pgTable, text, serial, integer, boolean, timestamp, unique, foreignKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Common enum for user roles
export const UserRole = {
  ADMIN: "admin",
  STUDENT: "student",
  TEACHER: "teacher",
} as const;

// Election officer roles
export const OfficerRole = {
  CHAIRMAN: "chairman",
  RETURNING_OFFICER: "returning_officer",
  PRESIDING_OFFICER: "presiding_officer",
  ASSISTANT_OFFICER: "assistant_officer",
  OBSERVER: "observer",
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default(UserRole.STUDENT),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
}, (table) => {
  return {
    uniqueName: unique("course_name_per_department").on(table.name, table.departmentId),
  };
});

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull().unique(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  studentId: text("student_id").notNull().unique(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  levelId: integer("level_id").notNull().references(() => levels.id),
});

export const verifiedStudentIds = pgTable("verified_student_ids", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  isRegistered: boolean("is_registered").notNull().default(false),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  manifesto: text("manifesto").notNull(),
}, (table) => {
  return {
    uniqueCandidate: unique("one_position_per_student").on(table.studentId, table.positionId),
  };
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueVote: unique("one_vote_per_position").on(table.studentId, table.positionId),
  };
});

// Define possible election status values
export const ElectionStatus = {
  UPCOMING: "upcoming",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default(ElectionStatus.UPCOMING),
  positions: json("positions").notNull().default([]),  // Array of position IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const electionPositions = pgTable("election_positions", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
}, (table) => {
  return {
    uniquePositionPerElection: unique("unique_position_per_election").on(table.electionId, table.positionId),
  };
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  staffId: text("staff_id").notNull().unique(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  title: text("title").notNull(),
  qualification: text("qualification"),
  isActive: boolean("is_active").notNull().default(true),
});

export const electionOfficers = pgTable("election_officers", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id),
  electionId: integer("election_id").notNull().references(() => elections.id),
  role: text("role").notNull(), // chairman, returning_officer, presiding_officer, etc.
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  notes: text("notes"),
}, (table) => {
  return {
    uniqueOfficerAssignment: unique("unique_officer_assignment").on(table.teacherId, table.electionId, table.role),
  };
});

export const officerResponsibilities = pgTable("officer_responsibilities", {
  id: serial("id").primaryKey(),
  officerId: integer("officer_id").notNull().references(() => electionOfficers.id),
  responsibility: text("responsibility").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
});

export const officerActivity = pgTable("officer_activity", {
  id: serial("id").primaryKey(),
  officerId: integer("officer_id").notNull().references(() => electionOfficers.id),
  activity: text("activity").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: json("details"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Define insertion schemas using Zod
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  name: true,
  departmentId: true,
});

export const insertLevelSchema = createInsertSchema(levels).pick({
  level: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  userId: true,
  studentId: true,
  departmentId: true,
  courseId: true,
  levelId: true,
});

export const insertVerifiedStudentIdSchema = createInsertSchema(verifiedStudentIds).pick({
  studentId: true,
  isRegistered: true,
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  name: true,
  description: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  studentId: true,
  positionId: true,
  manifesto: true,
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  studentId: true,
  candidateId: true,
  positionId: true,
});

export const insertElectionSchema = createInsertSchema(elections).pick({
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  positions: true,
});

export const insertElectionPositionSchema = createInsertSchema(electionPositions).pick({
  electionId: true,
  positionId: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).pick({
  userId: true,
  staffId: true,
  departmentId: true,
  title: true, 
  qualification: true,
  isActive: true,
});

export const insertElectionOfficerSchema = createInsertSchema(electionOfficers).pick({
  teacherId: true,
  electionId: true,
  role: true,
  notes: true,
});

export const insertOfficerResponsibilitySchema = createInsertSchema(officerResponsibilities).pick({
  officerId: true,
  responsibility: true,
  isCompleted: true,
  dueDate: true,
  completedAt: true,
});

export const insertOfficerActivitySchema = createInsertSchema(officerActivity).pick({
  officerId: true,
  activity: true,
  details: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

// Registration schema (for client-side validation)
export const studentRegistrationSchema = z.object({
  studentId: z.string().min(5, "Student ID must be at least 5 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  departmentId: z.coerce.number().positive("Department is required"),
  courseId: z.coerce.number().positive("Course is required"),
  levelId: z.coerce.number().positive("Level is required"),
});

// Teacher registration schema
export const teacherRegistrationSchema = z.object({
  staffId: z.string().min(5, "Staff ID must be at least 5 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  departmentId: z.coerce.number().positive("Department is required"),
  title: z.string().min(2, "Title is required"),
  qualification: z.string().optional(),
});

// Election officer assignment schema
export const officerAssignmentSchema = z.object({
  teacherId: z.coerce.number().positive("Teacher is required"),
  electionId: z.coerce.number().positive("Election is required"),
  role: z.string().min(1, "Role is required"),
  notes: z.string().optional(),
});

// Officer responsibility schema
export const responsibilitySchema = z.object({
  responsibility: z.string().min(5, "Responsibility description is required"),
  dueDate: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Election form schema for frontend
export const electionFormSchema = z.object({
  name: z.string().min(3, "Election name is required and must be at least 3 characters"),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().min(1, "End time is required"),
  positions: z.array(z.number()).min(1, "At least one position must be selected"),
});

// Define export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type VerifiedStudentId = typeof verifiedStudentIds.$inferSelect;
export type InsertVerifiedStudentId = z.infer<typeof insertVerifiedStudentIdSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;

export type ElectionPosition = typeof electionPositions.$inferSelect;
export type InsertElectionPosition = z.infer<typeof insertElectionPositionSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type ElectionOfficer = typeof electionOfficers.$inferSelect;
export type InsertElectionOfficer = z.infer<typeof insertElectionOfficerSchema>;

export type OfficerResponsibility = typeof officerResponsibilities.$inferSelect;
export type InsertOfficerResponsibility = z.infer<typeof insertOfficerResponsibilitySchema>;

export type OfficerActivity = typeof officerActivity.$inferSelect;
export type InsertOfficerActivity = z.infer<typeof insertOfficerActivitySchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Extended types for frontend use
export type StudentWithUser = Student & { user: User };
export type TeacherWithUser = Teacher & { user: User };
export type CandidateWithDetails = Candidate & { student: StudentWithUser, position: Position };
export type ElectionOfficerWithDetails = ElectionOfficer & { 
  teacher: TeacherWithUser, 
  election: Election,
  responsibilities?: OfficerResponsibility[],
  activities?: OfficerActivity[]
};
export type VoteWithDetails = Vote & { candidate: CandidateWithDetails };
export type ElectionWithPositions = Election & { positionsList: Position[] };

// Registration request type
export type StudentRegistrationRequest = z.infer<typeof studentRegistrationSchema>;
export type TeacherRegistrationRequest = z.infer<typeof teacherRegistrationSchema>;
export type OfficerAssignmentRequest = z.infer<typeof officerAssignmentSchema>;
export type ResponsibilityRequest = z.infer<typeof responsibilitySchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ElectionFormData = z.infer<typeof electionFormSchema>;
