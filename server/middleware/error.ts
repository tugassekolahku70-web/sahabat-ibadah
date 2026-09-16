import { Request, Response, NextFunction } from "express";
import { generateUUID } from "../db/index.js";

export interface AppErrorOptions {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export class AppError extends Error {
  status: number;
  code: string;
  details: Record<string, any>;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.status = options.status || 400;
    this.code = options.code || "BAD_REQUEST";
    this.details = options.details || {};
  }
}

/**
 * Middleware penanganan error seragam sesuai PRD Bab 10.5
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req.headers["x-request-id"] as string) || `req_${generateUUID().slice(0, 8)}`;
  const status = err.status || (err.name === "ZodError" ? 400 : 500);
  const code = err.code || (err.name === "ZodError" ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR");
  const message = err.message || "Terjadi kesalahan internal pada server.";
  const details = err.details || (err.issues ? { issues: err.issues } : {});

  if (status >= 500) {
    console.error(`[Error ${requestId}]`, err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      requestId,
      details,
    },
  });
}
