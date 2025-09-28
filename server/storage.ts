import {
  users,
  materials,
  purchases,
  cartItems,
  reviews,
  uploads,
  adminSessions,
  type User,
  type UpsertUser,
  type Material,
  type InsertMaterial,
  type Purchase,
  type InsertPurchase,
  type CartItem,
  type InsertCartItem,
  type Review,
  type InsertReview,
  type Upload,
  type InsertUpload,
  type AdminSession,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, and, ilike, or, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Email/Password Authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithPassword(user: { email: string; password: string; firstName: string; lastName: string }): Promise<User>;
  validateUserPassword(email: string, password: string): Promise<User | null>;

  // Material operations
  getAllMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  searchMaterials(query: string, technology?: string, difficulty?: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  deleteMaterial(id: number): Promise<void>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { material: Material })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(userId: string, materialId: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Purchase operations
  getPurchases(userId: string): Promise<(Purchase & { material: Material })[]>;
  getAllPurchases(): Promise<(Purchase & { material: Material, user: User | null })[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  hasPurchased(userId: string, materialId: number): Promise<boolean>;

  // Review operations
  getReviews(materialId: number): Promise<(Review & { user: User })[]>;
  createReview(review: InsertReview): Promise<Review>;
  getUserReview(userId: string, materialId: number): Promise<Review | undefined>;

  // Upload operations (Admin CMS)
  getAllUploads(): Promise<Upload[]>;
  getUploadsByTechnology(technology: string): Promise<Upload[]>;
  getUpload(id: number): Promise<Upload | undefined>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  deleteUpload(id: number): Promise<void>;
  updateUploadStatus(id: number, isActive: boolean): Promise<void>;

  // Admin operations
  setUserRole(userId: string, role: string): Promise<void>;
  isAdmin(userId: string): Promise<boolean>;

  // Admin session operations
  createAdminSession(userId: string, ttlMs?: number): Promise<string>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<void>;
  cleanupExpiredAdminSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Email/Password Authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithPassword(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userId = crypto.randomUUID();
    
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isEmailVerified: false,
      })
      .returning();
    return user;
  }

  async validateUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  // Material operations
  async getAllMaterials(): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.isActive, true))
      .orderBy(desc(materials.createdAt));
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db
      .select()
      .from(materials)
      .where(and(eq(materials.id, id), eq(materials.isActive, true)));
    return material;
  }

  async searchMaterials(query: string, technology?: string, difficulty?: string): Promise<Material[]> {
    let whereConditions = [eq(materials.isActive, true)];

    if (query) {
      whereConditions.push(
        or(
          ilike(materials.title, `%${query}%`),
          ilike(materials.description, `%${query}%`)
        )!
      );
    }

    if (technology) {
      whereConditions.push(eq(materials.technology, technology));
    }

    if (difficulty) {
      whereConditions.push(eq(materials.difficulty, difficulty));
    }

    return await db
      .select()
      .from(materials)
      .where(and(...whereConditions))
      .orderBy(desc(materials.createdAt));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async deleteMaterial(id: number): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { material: Material })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        materialId: cartItems.materialId,
        createdAt: cartItems.createdAt,
        material: materials,
      })
      .from(cartItems)
      .innerJoin(materials, eq(cartItems.materialId, materials.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.materialId, item.materialId)));

    if (existingItem) {
      return existingItem;
    }

    const [newItem] = await db
      .insert(cartItems)
      .values(item)
      .returning();
    return newItem;
  }

  async removeFromCart(userId: string, materialId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.materialId, materialId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  // Purchase operations
  async getPurchases(userId: string): Promise<(Purchase & { material: Material })[]> {
    return await db
      .select({
        id: purchases.id,
        userId: purchases.userId,
        materialId: purchases.materialId,
        price: purchases.price,
        razorpayPaymentId: purchases.razorpayPaymentId,
        razorpayOrderId: purchases.razorpayOrderId,
        razorpaySignature: purchases.razorpaySignature,
        purchasedAt: purchases.purchasedAt,
        material: materials,
      })
      .from(purchases)
      .innerJoin(materials, eq(purchases.materialId, materials.id))
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));
  }

  async getAllPurchases(): Promise<(Purchase & { material: Material, user: User | null })[]> {
    return await db
      .select({
        id: purchases.id,
        userId: purchases.userId,
        materialId: purchases.materialId,
        price: purchases.price,
        razorpayPaymentId: purchases.razorpayPaymentId,
        razorpayOrderId: purchases.razorpayOrderId,
        razorpaySignature: purchases.razorpaySignature,
        purchasedAt: purchases.purchasedAt,
        material: materials,
        user: users,
      })
      .from(purchases)
      .innerJoin(materials, eq(purchases.materialId, materials.id))
      .leftJoin(users, eq(purchases.userId, users.id))
      .orderBy(desc(purchases.purchasedAt));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db
      .insert(purchases)
      .values({
        userId: purchase.userId,
        materialId: purchase.materialId,
        price: purchase.price,
        razorpayPaymentId: purchase.razorpayPaymentId,
        razorpayOrderId: purchase.razorpayOrderId,
        razorpaySignature: purchase.razorpaySignature,
      })
      .returning();
    return newPurchase;
  }

  async hasPurchased(userId: string, materialId: number): Promise<boolean> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.materialId, materialId)));
    return !!purchase;
  }

  // Review operations
  async getReviews(materialId: number): Promise<(Review & { user: User })[]> {
    return await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        materialId: reviews.materialId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: users,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.materialId, materialId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getUserReview(userId: string, materialId: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.materialId, materialId)));
    return review;
  }

  // Upload operations (Admin CMS)
  async getAllUploads(): Promise<Upload[]> {
    return await db
      .select()
      .from(uploads)
      .orderBy(desc(uploads.createdAt));
  }

  async getUploadsByTechnology(technology: string): Promise<Upload[]> {
    return await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.technology, technology), eq(uploads.isActive, true)))
      .orderBy(desc(uploads.createdAt));
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id));
    return upload;
  }

  async createUpload(upload: InsertUpload): Promise<Upload> {
    const [newUpload] = await db
      .insert(uploads)
      .values(upload)
      .returning();
    return newUpload;
  }

  async deleteUpload(id: number): Promise<void> {
    await db.delete(uploads).where(eq(uploads.id, id));
  }

  async updateUploadStatus(id: number, isActive: boolean): Promise<void> {
    await db
      .update(uploads)
      .set({ isActive })
      .where(eq(uploads.id, id));
  }

  // Admin operations
  async setUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId));
  }

  async isAdmin(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));
    return user?.role === 'admin';
  }

  // Admin session operations
  async createAdminSession(userId: string, ttlMs = 24 * 60 * 60 * 1000): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMs);
    await db.insert(adminSessions).values({ token, userId, expiresAt });
    return token;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.token, token));
    if (!session) return undefined;
    if (session.expiresAt < new Date()) {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
      return undefined;
    }
    return session;
  }

  async deleteAdminSession(token: string): Promise<void> {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }

  async cleanupExpiredAdminSessions(): Promise<void> {
    await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
