import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { refreshTokens, type User } from "../shared/schema.js";
import { db } from "./db.js";
import { storage } from "./storage.js";
import { env } from "./config.js";

const JWT_SECRET = env.JWT_SECRET;

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  if (!match) return null;
  return decodeURIComponent(match.substring(name.length + 1));
}

export async function createAuthTokens(user: User) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const rawRefresh = crypto.randomBytes(40).toString("hex");
  const hashedRefresh = crypto
    .createHash("sha256")
    .update(rawRefresh)
    .digest("hex");
  const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  await db
    .insert(refreshTokens)
    .values({ token: hashedRefresh, userId: user.id, expires });
  return { accessToken, refreshToken: rawRefresh };
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId as string;
  } catch {
    return null;
  }
}

export async function refreshAuthTokens(refreshToken: string) {
  const hashed = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, hashed));
  if (!record || record.expires < new Date()) {
    if (record) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, hashed));
    }
    return null;
  }

  const user = await storage.getUser(record.userId);
  if (!user) return null;

  await db.delete(refreshTokens).where(eq(refreshTokens.token, hashed));
  return await createAuthTokens(user);
}

export async function revokeRefreshToken(refreshToken: string) {
  const hashed = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await db.delete(refreshTokens).where(eq(refreshTokens.token, hashed));
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : getCookie(req, "accessToken");

  if (token) {
    const userId = await verifyAccessToken(token);
    if (userId) {
      const user = await storage.getUser(userId);
      const isAdmin = await storage.isAdmin(userId);
      (req as any).authUser = { ...user, isAdmin };
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
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
