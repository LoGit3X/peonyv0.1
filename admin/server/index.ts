console.log("--- ADMIN SERVER INDEX.TS STARTING - VERSION: ", new Date().toISOString(), "---"); // New log
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import path from "path";
import ViteExpress from "vite-express";
import { exit } from "process";

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json({ limit: '15mb' })); // Increased limit
app.use(express.urlencoded({ extended: false, limit: '15mb' })); // Increased limit

// Serve static files from attached_assets directory
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
  const httpServer = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '159.65.206.177';

  // Start the server
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
})();
