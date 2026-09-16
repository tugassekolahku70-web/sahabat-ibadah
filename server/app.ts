import express from "express";
import { isPostgres } from "./db/index.js";

// Rute & Middleware
import authRouter from "./routes/auth.js";
import teacherRouter from "./routes/teacher.js";
import parentRouter from "./routes/parent.js";
import messagesRouter from "./routes/messages.js";
import adminRouter from "./routes/admin.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

// Parsing JSON & Form body (dukung upload foto avatar/logo)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS Middleware untuk komunikasi aman di browser dan dev server
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health Check Endpoints
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    app: "Sahabat Ibadah API",
    version: "1.0.0",
    database: isPostgres ? "Supabase PostgreSQL (Cloud)" : "SQLite (Local node:sqlite)",
    timestamp: new Date().toISOString(),
  });
};

app.get("/api/v1/health", healthHandler);
app.get("/v1/health", healthHandler);
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// Daftarkan rute API (mendukung prefix /api/v1 dan /v1 jika di-rewrite oleh serverless host)
const mountRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/teacher`, teacherRouter);
  app.use(`${prefix}/classes`, teacherRouter);
  app.use(`${prefix}/parent`, parentRouter);
  app.use(`${prefix}/children`, parentRouter);
  app.use(`${prefix}/messages`, messagesRouter);
  app.use(`${prefix}/admin`, adminRouter);
};

mountRoutes("/api/v1");
mountRoutes("/v1");

// Global Error Handler
app.use(errorHandler);

export default app;
