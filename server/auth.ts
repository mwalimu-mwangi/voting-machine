import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, insertUserSchema, loginUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.warn("No SESSION_SECRET environment variable set, using a default one for development");
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "campus-vote-secret-key-dev",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Update last login time
        await storage.updateUserLastLogin(user.id);
        
        // Log login activity
        await storage.logActivity(
          user.id, 
          "Login", 
          `User ${user.username} logged in`
        );
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Student Registration
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Verify student ID exists and is not already registered
      const student = await storage.getStudentByStudentId(validatedData.username);
      
      if (!student) {
        return res.status(400).json({ message: "Invalid student ID. Please contact your administrator." });
      }
      
      if (student.isRegistered) {
        return res.status(400).json({ message: "Student ID is already registered." });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: 'student',
        department: student.department
      });
      
      // Update student record to mark as registered
      await storage.updateStudentRegistration(validatedData.username, user.id);
      
      // Log activity
      await storage.logActivity(
        user.id, 
        "Registration", 
        `User ${user.username} registered`,
        req.ip
      );
      
      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  // Admin account registration (for development)
  app.post("/api/admin/register", async (req, res, next) => {
    try {
      // This endpoint should be disabled in production
      if (app.get("env") === "production") {
        return res.status(404).json({ message: "Not found" });
      }
      
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create admin user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: 'admin'
      });
      
      // Log activity
      await storage.logActivity(
        user.id, 
        "Admin Registration", 
        `Admin ${user.username} registered`,
        req.ip
      );
      
      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    try {
      // Validate request body
      loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Return user without password
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    // Log activity before logging out
    if (req.isAuthenticated()) {
      storage.logActivity(
        req.user.id, 
        "Logout", 
        `User ${req.user.username} logged out`,
        req.ip
      ).catch(console.error);
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Express.Response, next: Express.NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Admin role middleware
  const isAdmin = (req: Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  };
  
  // Student role middleware
  const isStudent = (req: Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: "Forbidden: Student access required" });
    }
    
    next();
  };
  
  return { isAuthenticated, isAdmin, isStudent };
}
