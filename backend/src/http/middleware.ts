import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "./errors.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation error", details: err.flatten() });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

