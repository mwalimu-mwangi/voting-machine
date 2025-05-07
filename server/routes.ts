import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertPositionSchema,
  insertCandidateSchema,
  insertVoteSchema,
  insertStudentSchema,
  insertElectionSchema
} from "@shared/schema";
import { z } from "zod";
import { parse as parseCsv } from 'csv-parse/sync';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  const { isAuthenticated, isAdmin, isStudent } = setupAuth(app);
  
  // Setup file upload middleware
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
  });
  
  /* Student Management Routes - Admin only */
  
  // Get all students
  app.get("/api/students", isAdmin, async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      
      const { students, total } = await storage.getStudents(page, pageSize);
      
      res.json({
        students,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get student by ID
  app.get("/api/students/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudentById(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      next(error);
    }
  });
  
  // Add a single student
  app.post("/api/students", isAdmin, async (req, res, next) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      
      // Check if student ID already exists
      const existingStudent = await storage.getStudentByStudentId(validatedData.studentId);
      if (existingStudent) {
        return res.status(400).json({ message: "Student ID already exists" });
      }
      
      const student = await storage.createStudent(validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Student Added",
        `Added student with ID ${student.studentId}`,
        req.ip
      );
      
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Import students from CSV
  app.post("/api/students/import", isAdmin, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Parse CSV file
      const content = req.file.buffer.toString('utf8');
      const records = parseCsv(content, {
        columns: true,
        skip_empty_lines: true
      });
      
      if (!records.length) {
        return res.status(400).json({ message: "CSV file is empty or invalid" });
      }
      
      // Validate and transform records
      const students = records.map((record: any) => ({
        studentId: record.studentId?.toString(),
        department: record.department || null
      }));
      
      // Validate each student
      students.forEach((student: any) => {
        insertStudentSchema.parse(student);
      });
      
      // Import students
      const importedCount = await storage.importStudents(students);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Students Imported",
        `Imported ${importedCount} students`,
        req.ip
      );
      
      res.status(200).json({ 
        message: `Successfully imported ${importedCount} students`,
        count: importedCount
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  /* Position Management Routes - Admin only */
  
  // Get all positions
  app.get("/api/positions", async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      
      const { positions, total } = await storage.getPositions(page, pageSize);
      
      res.json({
        positions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get position by ID
  app.get("/api/positions/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.getPositionById(id);
      
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      res.json(position);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new position
  app.post("/api/positions", isAdmin, async (req, res, next) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      
      const position = await storage.createPosition(validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Position Created",
        `Created position: ${position.name}`,
        req.ip
      );
      
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Update a position
  app.patch("/api/positions/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if position exists
      const existingPosition = await storage.getPositionById(id);
      if (!existingPosition) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      // Validate updated fields
      const validatedData = insertPositionSchema.partial().parse(req.body);
      
      const updatedPosition = await storage.updatePosition(id, validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Position Updated",
        `Updated position: ${updatedPosition?.name}`,
        req.ip
      );
      
      res.json(updatedPosition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  /* Candidate Management Routes - Admin only */
  
  // Get all candidates
  app.get("/api/candidates", async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const positionId = req.query.positionId ? parseInt(req.query.positionId as string) : undefined;
      
      const { candidates, total } = await storage.getCandidates(page, pageSize, positionId);
      
      res.json({
        candidates,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get candidate by ID
  app.get("/api/candidates/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidateById(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new candidate
  app.post("/api/candidates", isAdmin, async (req, res, next) => {
    try {
      const validatedData = insertCandidateSchema.parse(req.body);
      
      // Check if position exists
      const position = await storage.getPositionById(validatedData.positionId);
      if (!position) {
        return res.status(400).json({ message: "Position does not exist" });
      }
      
      const candidate = await storage.createCandidate(validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Candidate Added",
        `Added candidate ${candidate.name} for position ${position.name}`,
        req.ip
      );
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Update a candidate
  app.patch("/api/candidates/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if candidate exists
      const existingCandidate = await storage.getCandidateById(id);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Validate updated fields
      const validatedData = insertCandidateSchema.partial().parse(req.body);
      
      // If position ID is being updated, check that the position exists
      if (validatedData.positionId) {
        const position = await storage.getPositionById(validatedData.positionId);
        if (!position) {
          return res.status(400).json({ message: "Position does not exist" });
        }
      }
      
      const updatedCandidate = await storage.updateCandidate(id, validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Candidate Updated",
        `Updated candidate: ${updatedCandidate?.name}`,
        req.ip
      );
      
      res.json(updatedCandidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  /* Voting Routes - Student only */
  
  // Cast a vote
  app.post("/api/vote", isStudent, async (req, res, next) => {
    try {
      const validatedData = insertVoteSchema.parse(req.body);
      
      // Check if position exists
      const position = await storage.getPositionById(validatedData.positionId);
      if (!position) {
        return res.status(400).json({ message: "Position does not exist" });
      }
      
      // Check if candidate exists and belongs to the specified position
      const candidate = await storage.getCandidateById(validatedData.candidateId);
      if (!candidate || candidate.positionId !== validatedData.positionId) {
        return res.status(400).json({ message: "Invalid candidate for this position" });
      }
      
      try {
        const vote = await storage.castVote(
          req.user.id,
          validatedData.positionId,
          validatedData.candidateId
        );
        
        // Log activity
        await storage.logActivity(
          req.user.id,
          "Vote Cast",
          `Vote cast for position ${position.name}`,
          req.ip
        );
        
        res.status(201).json({ 
          message: "Vote cast successfully",
          vote 
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("already voted")) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Get user's votes
  app.get("/api/my-votes", isAuthenticated, async (req, res, next) => {
    try {
      const userVotes = await storage.getUserVotes(req.user.id);
      res.json(userVotes);
    } catch (error) {
      next(error);
    }
  });
  
  /* Results Routes */
  
  // Get overall results
  app.get("/api/results", isAuthenticated, async (req, res, next) => {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (error) {
      next(error);
    }
  });
  
  // Get results for a specific position
  app.get("/api/results/:positionId", isAuthenticated, async (req, res, next) => {
    try {
      const positionId = parseInt(req.params.positionId);
      
      // Check if position exists
      const position = await storage.getPositionById(positionId);
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      const results = await storage.getPositionResults(positionId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });
  
  /* Election Management Routes - Admin only */
  
  // Get all elections
  app.get("/api/elections", isAdmin, async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      
      const { elections, total } = await storage.getElections(page, pageSize);
      
      res.json({
        elections,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get election by ID
  app.get("/api/elections/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const election = await storage.getElectionById(id);
      
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      res.json(election);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new election
  app.post("/api/elections", isAdmin, async (req, res, next) => {
    try {
      const validatedData = insertElectionSchema.parse(req.body);
      
      const election = await storage.createElection({
        ...validatedData,
        createdBy: req.user.id
      });
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Election Created",
        `Created election: ${election.name}`,
        req.ip
      );
      
      res.status(201).json(election);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Update an election
  app.patch("/api/elections/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if election exists
      const existingElection = await storage.getElectionById(id);
      if (!existingElection) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      // Validate updated fields
      const validatedData = insertElectionSchema.partial().parse(req.body);
      
      const updatedElection = await storage.updateElection(id, validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Election Updated",
        `Updated election: ${updatedElection?.name}`,
        req.ip
      );
      
      res.json(updatedElection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Activate an election
  app.post("/api/elections/:id/activate", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if election exists
      const existingElection = await storage.getElectionById(id);
      if (!existingElection) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      await storage.activateElection(id);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Election Activated",
        `Activated election: ${existingElection.name}`,
        req.ip
      );
      
      res.json({ message: "Election activated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Deactivate an election
  app.post("/api/elections/:id/deactivate", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if election exists
      const existingElection = await storage.getElectionById(id);
      if (!existingElection) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      await storage.deactivateElection(id);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Election Deactivated",
        `Deactivated election: ${existingElection.name}`,
        req.ip
      );
      
      res.json({ message: "Election deactivated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Complete an election
  app.post("/api/elections/:id/complete", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if election exists
      const existingElection = await storage.getElectionById(id);
      if (!existingElection) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      await storage.completeElection(id);
      
      // Log activity
      await storage.logActivity(
        req.user.id,
        "Election Completed",
        `Completed election: ${existingElection.name}`,
        req.ip
      );
      
      res.json({ message: "Election marked as complete successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  /* Activity Log Routes - Admin only */
  
  // Get recent activity
  app.get("/api/activity", isAdmin, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
