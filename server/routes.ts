import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { WebSocketServer } from "ws";
import { z } from "zod";
import {
  insertDepartmentSchema,
  insertCourseSchema,
  insertLevelSchema,
  insertPositionSchema,
  insertCandidateSchema,
  insertVoteSchema,
  insertVerifiedStudentIdSchema,
  insertElectionSchema,
  insertElectionPositionSchema,
  electionFormSchema,
  UserRole,
  ElectionStatus
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes and middleware
  setupAuth(app);

  const httpServer = createServer(app);

  // WebSocket server for real-time updates with Replit support
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws", // Explicit path for WebSocket connections
    perMessageDeflate: false // Disable compression to avoid issues
  });
  
  // Store connected clients with their type (admin/student)
  const clients = new Map<any, { type: string }>();

  wss.on("connection", (ws) => {
    console.log("WebSocket connection established");
    // Add client to the list
    clients.set(ws, { type: "unknown" });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Client identifies itself
        if (data.type === "identify") {
          clients.set(ws, { type: data.role || "unknown" });
          console.log(`Client identified as: ${data.role || "unknown"}`);
        }
      } catch (err) {
        console.error("Invalid WebSocket message", err);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      clients.delete(ws);
    });
  });

  // Helper function to broadcast updates to clients
  function broadcastUpdate(eventType: string, data: any, role?: string) {
    const message = JSON.stringify({ type: eventType, data });
    
    clients.forEach((client, ws) => {
      if (ws.readyState === ws.OPEN && (!role || client.type === role)) {
        ws.send(message);
      }
    });
  }

  // === Department Routes ===
  // Get all departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create department (admin only)
  app.post("/api/admin/departments", async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      broadcastUpdate("departmentCreated", department, UserRole.ADMIN);
      res.status(201).json(department);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update department (admin only)
  app.put("/api/admin/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, validatedData);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      broadcastUpdate("departmentUpdated", department, UserRole.ADMIN);
      res.json(department);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete department (admin only)
  app.delete("/api/admin/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDepartment(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete department with associated courses" });
      }
      
      broadcastUpdate("departmentDeleted", { id }, UserRole.ADMIN);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Course Routes ===
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get courses by department
  app.get("/api/departments/:id/courses", async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      const courses = await storage.getCoursesByDepartment(departmentId);
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create course (admin only)
  app.post("/api/admin/courses", async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      broadcastUpdate("courseCreated", course, UserRole.ADMIN);
      res.status(201).json(course);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update course (admin only)
  app.put("/api/admin/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, validatedData);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      broadcastUpdate("courseUpdated", course, UserRole.ADMIN);
      res.json(course);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete course (admin only)
  app.delete("/api/admin/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourse(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete course with associated students" });
      }
      
      broadcastUpdate("courseDeleted", { id }, UserRole.ADMIN);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Level Routes ===
  // Get all levels
  app.get("/api/levels", async (req, res) => {
    try {
      const levels = await storage.getLevels();
      res.json(levels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create level (admin only)
  app.post("/api/admin/levels", async (req, res) => {
    try {
      const validatedData = insertLevelSchema.parse(req.body);
      const level = await storage.createLevel(validatedData);
      broadcastUpdate("levelCreated", level, UserRole.ADMIN);
      res.status(201).json(level);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid level data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // === Student Routes ===
  // Get all students (admin only)
  app.get("/api/admin/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get student by ID (for profile)
  app.get("/api/student/profile", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // If user is admin, they don't have a student profile
      if (req.user.role === UserRole.ADMIN) {
        return res.status(403).json({ message: "Admins don't have a student profile" });
      }
      
      const student = await storage.getStudentByStudentId(req.user.username);
      
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Verified Student ID Routes ===
  // Get all verified student IDs (admin only)
  app.get("/api/admin/verified-student-ids", async (req, res) => {
    try {
      const ids = await storage.getVerifiedStudentIds();
      res.json(ids);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check if a student ID is verified (for registration)
  app.get("/api/verify-student-id/:id", async (req, res) => {
    try {
      const studentId = req.params.id;
      const verifiedId = await storage.getVerifiedStudentId(studentId);
      
      if (!verifiedId) {
        return res.status(404).json({ verified: false, message: "Student ID not found in verified list" });
      }
      
      if (verifiedId.isRegistered) {
        return res.status(400).json({ verified: false, message: "Student ID is already registered" });
      }
      
      res.json({ verified: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add verified student ID (admin only)
  app.post("/api/admin/verified-student-ids", async (req, res) => {
    try {
      const validatedData = insertVerifiedStudentIdSchema.parse(req.body);
      const verifiedId = await storage.createVerifiedStudentId(validatedData);
      broadcastUpdate("verifiedStudentIdCreated", verifiedId, UserRole.ADMIN);
      res.status(201).json(verifiedId);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid student ID data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk upload verified student IDs (admin only)
  app.post("/api/admin/verified-student-ids/bulk", async (req, res) => {
    try {
      const schema = z.object({
        studentIds: z.array(z.string().min(1))
      });
      
      const { studentIds } = schema.parse(req.body);
      
      if (studentIds.length === 0) {
        return res.status(400).json({ message: "No student IDs provided" });
      }
      
      const count = await storage.bulkCreateVerifiedStudentIds(studentIds);
      res.status(201).json({ count, message: `${count} student IDs added` });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // === Position Routes ===
  // Get all positions
  app.get("/api/positions", async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create position (admin only)
  app.post("/api/admin/positions", async (req, res) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(validatedData);
      broadcastUpdate("positionCreated", position);
      res.status(201).json(position);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid position data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update position (admin only)
  app.put("/api/admin/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPositionSchema.partial().parse(req.body);
      const position = await storage.updatePosition(id, validatedData);
      
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      broadcastUpdate("positionUpdated", position);
      res.json(position);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid position data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete position (admin only)
  app.delete("/api/admin/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePosition(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete position with associated candidates" });
      }
      
      broadcastUpdate("positionDeleted", { id });
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Candidate Routes ===
  // Get all candidates
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get candidates by position
  app.get("/api/positions/:id/candidates", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const candidates = await storage.getCandidatesByPosition(positionId);
      res.json(candidates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create candidate (admin only)
  app.post("/api/admin/candidates", async (req, res) => {
    try {
      const validatedData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(validatedData);
      broadcastUpdate("candidateCreated", candidate);
      res.status(201).json(candidate);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid candidate data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update candidate (admin only)
  app.put("/api/admin/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCandidateSchema.partial().parse(req.body);
      const candidate = await storage.updateCandidate(id, validatedData);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      broadcastUpdate("candidateUpdated", candidate);
      res.json(candidate);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid candidate data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete candidate (admin only)
  app.delete("/api/admin/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCandidate(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete candidate with votes" });
      }
      
      broadcastUpdate("candidateDeleted", { id });
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Vote Routes ===
  // Cast a vote (student only)
  app.post("/api/student/vote", async (req, res) => {
    try {
      // Check if voting is enabled
      const votingEnabled = await storage.getSetting("votingEnabled");
      if (votingEnabled !== "true") {
        return res.status(403).json({ message: "Voting is currently closed" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get student by user ID
      const student = await storage.getStudentByStudentId(req.user.username);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const validatedData = insertVoteSchema.parse({
        ...req.body,
        studentId: student.id
      });

      // Check if student has already voted for this position
      const hasVoted = await storage.hasStudentVotedForPosition(
        student.id,
        validatedData.positionId
      );

      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted for this position" });
      }

      const vote = await storage.createVote(validatedData);
      
      broadcastUpdate("voteCreated", {
        positionId: vote.positionId,
        candidateId: vote.candidateId
      });
      
      res.status(201).json({ message: "Vote cast successfully" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get all votes (admin only)
  app.get("/api/admin/votes", async (req, res) => {
    try {
      const votes = await storage.getVotes();
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get vote counts by position
  app.get("/api/positions/:id/votes", async (req, res) => {
    try {
      // Check if results are visible to students
      const resultsVisible = await storage.getSetting("resultsVisible");
      
      if (resultsVisible !== "true" && (!req.user || req.user.role !== UserRole.ADMIN)) {
        return res.status(403).json({ message: "Vote results are not currently visible" });
      }
      
      const positionId = parseInt(req.params.id);
      const votes = await storage.getVotesCountByPosition(positionId);
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check if student has voted for a position
  app.get("/api/student/votes/check/:positionId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get student by user ID
      const student = await storage.getStudentByStudentId(req.user.username);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      const positionId = parseInt(req.params.positionId);
      const hasVoted = await storage.hasStudentVotedForPosition(student.id, positionId);
      
      res.json({ hasVoted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get votes by department statistics (for charts)
  app.get("/api/stats/votes-by-department", async (req, res) => {
    try {
      const stats = await storage.getVotingStatsByDepartment();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Settings Routes ===
  // Get a setting
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const value = await storage.getSetting(key);
      
      if (value === undefined) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json({ key, value });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all settings (admin only)
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update setting (admin only)
  app.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const schema = z.object({
        value: z.string()
      });
      
      const { value } = schema.parse(req.body);
      const setting = await storage.updateSetting(key, value);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      broadcastUpdate("settingUpdated", setting);
      res.json(setting);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Reset votes (admin only)
  app.post("/api/admin/reset-votes", async (req, res) => {
    try {
      const success = await storage.resetVotes();
      
      if (success) {
        broadcastUpdate("votesReset", { timestamp: new Date().toISOString() });
        res.json({ message: "Votes reset successfully" });
      } else {
        res.status(500).json({ message: "Failed to reset votes" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === Election Routes ===
  // Get all elections
  app.get("/api/elections", async (req, res) => {
    try {
      const elections = await storage.getElections();
      res.json(elections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get active elections
  app.get("/api/elections/active", async (req, res) => {
    try {
      const elections = await storage.getActiveElections();
      res.json(elections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get election by ID
  app.get("/api/elections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const election = await storage.getElection(id);
      
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      res.json(election);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get positions for an election
  app.get("/api/elections/:id/positions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const positions = await storage.getElectionPositions(id);
      res.json(positions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create election (admin only)
  app.post("/api/admin/elections", async (req, res) => {
    try {
      // First validate with the form schema
      const formData = electionFormSchema.parse(req.body);
      
      // Create dates from the form inputs
      const startDate = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDate = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Check that dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      // Check that end date is after start date
      if (endDate <= startDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      
      // Prepare election data
      const electionData = {
        name: formData.name,
        startDate,
        endDate,
        status: ElectionStatus.UPCOMING,
        positions: formData.positions
      };
      
      // Validate with the storage schema
      const validatedData = insertElectionSchema.parse(electionData);
      const election = await storage.createElection(validatedData);
      
      // Create election position mappings in the junction table
      if (Array.isArray(formData.positions)) {
        for (const positionId of formData.positions) {
          await storage.addPositionToElection({
            electionId: election.id,
            positionId
          });
        }
      }
      
      broadcastUpdate("electionCreated", election);
      res.status(201).json(election);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid election data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update election (admin only)
  app.put("/api/admin/elections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if election exists
      const existingElection = await storage.getElection(id);
      if (!existingElection) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      // Handle form updates vs partial updates
      let updateData: any;
      
      if (req.body.startDate && req.body.startTime && req.body.endDate && req.body.endTime) {
        // It's a form update
        const formData = electionFormSchema.parse(req.body);
        
        // Create dates from the form inputs
        const startDate = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDate = new Date(`${formData.endDate}T${formData.endTime}`);
        
        // Check that dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        // Check that end date is after start date
        if (endDate <= startDate) {
          return res.status(400).json({ message: "End date must be after start date" });
        }
        
        updateData = {
          name: formData.name,
          startDate,
          endDate,
          positions: formData.positions
        };
        
        // Update position mappings if positions have changed
        if (Array.isArray(formData.positions)) {
          // Get current positions
          const currentPositions = await storage.getElectionPositions(id);
          const currentPositionIds = currentPositions.map(p => p.id);
          
          // Add new positions
          for (const positionId of formData.positions) {
            if (!currentPositionIds.includes(positionId)) {
              await storage.addPositionToElection({
                electionId: id,
                positionId
              });
            }
          }
          
          // Remove positions that were removed
          for (const positionId of currentPositionIds) {
            if (!formData.positions.includes(positionId)) {
              await storage.removePositionFromElection(id, positionId);
            }
          }
        }
      } else {
        // It's a partial update
        updateData = insertElectionSchema.partial().parse(req.body);
      }
      
      const election = await storage.updateElection(id, updateData);
      
      broadcastUpdate("electionUpdated", election);
      res.json(election);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid election data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update election status (admin only)
  app.put("/api/admin/elections/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({
        status: z.enum([ElectionStatus.UPCOMING, ElectionStatus.ACTIVE, ElectionStatus.COMPLETED])
      });
      
      const { status } = schema.parse(req.body);
      const election = await storage.updateElectionStatus(id, status);
      
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      broadcastUpdate("electionStatusUpdated", election);
      res.json(election);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid status", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete election (admin only)
  app.delete("/api/admin/elections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteElection(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete election" });
      }
      
      broadcastUpdate("electionDeleted", { id });
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add position to election (admin only)
  app.post("/api/admin/elections/:id/positions", async (req, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const schema = z.object({
        positionId: z.number().int().positive()
      });
      
      const { positionId } = schema.parse(req.body);
      const electionPosition = await storage.addPositionToElection({
        electionId,
        positionId
      });
      
      broadcastUpdate("electionPositionAdded", {
        electionId,
        positionId
      });
      
      res.status(201).json(electionPosition);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid position data", errors: error.errors });
      }
      if (error.message === "Position is already in this election") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Remove position from election (admin only)
  app.delete("/api/admin/elections/:electionId/positions/:positionId", async (req, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const positionId = parseInt(req.params.positionId);
      
      const success = await storage.removePositionFromElection(electionId, positionId);
      
      if (!success) {
        return res.status(404).json({ message: "Election position not found" });
      }
      
      broadcastUpdate("electionPositionRemoved", {
        electionId,
        positionId
      });
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // === Stats Routes ===
  // Get dashboard stats
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
