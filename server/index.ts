import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "dotenv";
import multer from "multer";

// Load environment variables
config();

// Ensure SESSION_SECRET is set
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "campus-vote-dev-secret";
  console.warn("Warning: SESSION_SECRET not set, using default value for development");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup file upload middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Make upload middleware available for routes
app.use((req: any, res, next) => {
  req.upload = upload;
  next();
});

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response data if not too big
      if (capturedJsonResponse && !Array.isArray(capturedJsonResponse)) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length < 80) {
          logLine += ` :: ${responseStr}`;
        } else {
          logLine += ` :: [Response data too large]`;
        }
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error: ${message}`);
    console.error(err.stack);

    res.status(status).json({ message });
  });

  // Setup Vite in development and serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`CampusVote server running on port ${port}`);
    log(`Environment: ${app.get("env")}`);
  });
})();
