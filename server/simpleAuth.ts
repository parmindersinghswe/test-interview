// Simple authentication system for testing without session conflicts
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import type { User } from "@shared/schema";
import { storage } from "./storage";
import { datetime } from "drizzle-orm/mysql-core";

// Simple in-memory token store for testing
const activeTokens = new Map<string, { user: User; userId: string; expires: number }>();

export function createAuthToken(user: User): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  activeTokens.set(token, { user, userId: user.id, expires });
  return token;
}

export function verifyAuthToken(token: string): string | null {
  console.log("Active Tokens:", activeTokens);
  console.log("current token", token);
  for (const [tokenKey, tokenData] of activeTokens.entries()) {
    if (tokenData.expires >= Date.now()) {
      console.log("Returning first valid token:", tokenKey);
      return tokenData.userId;
    } else {
      // Clean up expired tokens
      console.log("Deleting expired token:", tokenKey);
      activeTokens.delete(tokenKey);
    }
  }
  return null;
}

export function deleteAuthToken(token: string): void {
  console.log("deleting auth token")
  activeTokens.delete(token);
}

export async function simpleAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (token) {
    const userId = verifyAuthToken(token);

    if (userId) {
      const user = await storage.getUser(userId);
      const isAdmin = await storage.isAdmin(userId);
      
      (req as any).authUser = {
        ...user,
        isAdmin
      };
      (req as any).userId = userId;
    }
  }
  
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).authUser;
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required6" });
  }
  next();
}