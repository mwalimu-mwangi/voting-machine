import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User role enum
export const roleEnum = pgEnum('role', ['admin', 'student']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  role: roleEnum("role").notNull().default('student'),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// Students table for verified student IDs
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  department: text("department"),
  isRegistered: boolean("is_registered").default(false),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Elections table
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").default(false),
  isComplete: boolean("is_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  electionId: integer("election_id").references(() => elections.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  year: text("year").notNull(),
  positionId: integer("position_id").references(() => positions.id).notNull(),
  bio: text("bio"),
  platform: text("platform"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  positionId: integer("position_id").references(() => positions.id).notNull(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity log table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  votes: many(votes),
  activityLogs: many(activityLogs),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
}));

export const electionsRelations = relations(elections, ({ one, many }) => ({
  positions: many(positions),
  creator: one(users, {
    fields: [elections.createdBy],
    references: [users.id],
  }),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  candidates: many(candidates),
  votes: many(votes),
  election: one(elections, {
    fields: [positions.electionId],
    references: [elections.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  position: one(positions, {
    fields: [candidates.positionId],
    references: [positions.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  position: one(positions, {
    fields: [votes.positionId],
    references: [positions.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
  fullName: (schema) => schema.min(2, "Full name is required"),
  email: (schema) => schema.email("Please enter a valid email").optional().nullable(),
}).omit({ 
  id: true, 
  createdAt: true, 
  lastLogin: true 
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required"),
});

export const insertStudentSchema = createInsertSchema(students, {
  studentId: (schema) => schema.min(3, "Student ID must be at least 3 characters"),
}).omit({
  id: true,
  createdAt: true,
  isRegistered: true,
  userId: true,
});

export const insertPositionSchema = createInsertSchema(positions, {
  name: (schema) => schema.min(2, "Position name must be at least 2 characters"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates, {
  name: (schema) => schema.min(2, "Candidate name must be at least 2 characters"),
  department: (schema) => schema.min(2, "Department name must be at least 2 characters"),
  positionId: (schema) => schema.positive("Position ID must be a positive number"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertElectionSchema = createInsertSchema(elections, {
  name: (schema) => schema.min(2, "Election name must be at least 2 characters"),
  startTime: (schema) => schema,
  endTime: (schema) => schema,
}).omit({
  id: true,
  createdAt: true,
  isActive: true,
  isComplete: true,
});

export const insertVoteSchema = createInsertSchema(votes, {
  positionId: (schema) => schema.positive("Position ID must be a positive number"),
  candidateId: (schema) => schema.positive("Candidate ID must be a positive number"),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
