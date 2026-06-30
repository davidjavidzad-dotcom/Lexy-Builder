import type { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "crypto";

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readBasicPassword(req: Request) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return "";

  try {
    const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf-8");
    const separator = decoded.indexOf(":");
    return separator >= 0 ? decoded.slice(separator + 1) : "";
  } catch {
    return "";
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    if (process.env.NODE_ENV !== "production") {
      return next();
    }
    return res.status(503).json({ error: "Admin access is not configured." });
  }

  const password = readBasicPassword(req);
  if (password && constantTimeEquals(password, expectedPassword)) {
    return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="GoodLegal Admin"');
  return res.status(401).send("Admin password required.");
}
