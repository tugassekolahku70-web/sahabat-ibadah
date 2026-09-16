import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { isPostgres } from "./db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const server = createServer(app);

  // Serve static files in local production mode
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Client-side routing fallback (for local SPA production)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(staticPath, "index.html"), (err) => {
      if (err) {
        res.status(200).send("Sahabat Ibadah API running. Frontend dev server: http://localhost:3000/");
      }
    });
  });

  const port = Number(process.env.PORT) || 5000;

  server.listen(port, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 Sahabat Ibadah Backend berjalan di http://localhost:${port}/`);
    console.log(`📚 Database: ${isPostgres ? "PostgreSQL Supabase (Cloud)" : "SQLite Local (server/data/sahabat_ibadah.db)"}`);
    console.log(`⚡ Health Check: http://localhost:${port}/api/v1/health`);
    console.log(`========================================================\n`);
  });
}

startServer().catch((err) => {
  console.error("Gagal memulai server backend:", err);
  process.exit(1);
});
