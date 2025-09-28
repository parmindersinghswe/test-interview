import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // 'admin' or 'user'
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Persistent admin session store
export const adminSessions = pgTable(
  "admin_sessions",
  {
    token: varchar("token").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("IDX_admin_session_expires").on(table.expiresAt)],
);

// Refresh tokens for JWT authentication
export const refreshTokens = pgTable("refresh_tokens", {
  token: varchar("token", { length: 128 }).primaryKey(), // hashed token
  userId: varchar("user_id").notNull().references(() => users.id),
  expires: timestamp("expires").notNull(),
});

// Interview materials/products
export const materials = pgTable(
  "materials",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    technology: varchar("technology").notNull(), // dotnet, react, flutter, general
    difficulty: varchar("difficulty").notNull(), // beginner, intermediate, advanced
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
    pages: integer("pages").notNull(),
    rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    imageUrl: text("image_url"),
    contentUrl: text("content_url"), // Path to the material file
    previewUrl: text("preview_url"), // Path to preview content
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_materials_technology").on(table.technology),
    index("IDX_materials_difficulty").on(table.difficulty),
    index("IDX_materials_created_at").on(table.createdAt),
  ],
);

// User purchases
export const purchases = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),
    materialId: integer("material_id").notNull().references(() => materials.id),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpaySignature: text("razorpay_signature"),
    purchasedAt: timestamp("purchased_at").defaultNow(),
  },
  (table) => [
    index("IDX_purchases_razorpay_order_id").on(table.razorpayOrderId),
    index("IDX_purchases_razorpay_signature").on(table.razorpaySignature),
  ],
);

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// File uploads for admin CMS
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  technology: varchar("technology").notNull(), // 'java', 'python', 'react', etc.
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Relations
export const materialsRelations = relations(materials, ({ many }) => ({
  purchases: many(purchases),
  cartItems: many(cartItems),
  reviews: many(reviews),
}));

export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
  cartItems: many(cartItems),
  reviews: many(reviews),
  uploads: many(uploads),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  uploader: one(users, {
    fields: [uploads.uploadedBy],
    references: [users.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [purchases.materialId],
    references: [materials.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [cartItems.materialId],
    references: [materials.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [reviews.materialId],
    references: [materials.id],
  }),
}));

// Schemas for validation
export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
