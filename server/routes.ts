import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
// Removed complex auth imports to avoid conflicts
import { insertMaterialSchema, insertCartItemSchema, insertPurchaseSchema, insertReviewSchema, insertUploadSchema } from "@shared/schema";
import { z } from "zod";

// Initialize Stripe only if a secret key is available
let stripe: Stripe | null = null;
// Use a single STRIPE_SECRET_KEY environment variable for both
// development and production as documented in the README.
// If STRIPE_SECRET_KEY is not provided, fall back to the legacy
// STRIPE_LIVE_SECRET_KEY or STRIPE_TEST_SECRET_KEY variables.
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  (process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_LIVE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY);

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    // @ts-ignore using supported API version
    apiVersion: process.env.STRIPE_API_VERSION || '2024-03-15',
  });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = req.user.claims.sub;
  const adminCheck = await storage.isAdmin(userId);
  
  if (!adminCheck) {
    return res.status(403).json({ message: "Admin access required4" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Express> {
  // Simple in-memory session store for demo
  const activeSessions = new Map<string, any>();
  
  // Auth middleware - temporarily disabled to prevent conflicts
  // await setupAuth(app);

  // Auth routes - placeholder for regular auth (currently disabled)
  app.get('/api/auth/user', async (req: any, res) => {
    res.status(401).json({ message: "Unauthorized" });
  });

  // Material routes
  app.get('/api/materials', async (req, res) => {
    try {
      const { search, technology, difficulty } = req.query;
      let materials;
      
      if (search || technology || difficulty) {
        materials = await storage.searchMaterials(
          search as string || '',
          technology as string,
          difficulty as string
        );
      } else {
        materials = await storage.getAllMaterials();
      }
      
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get('/api/materials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      res.json(material);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check if user already purchased this material
      const hasPurchased = await storage.hasPurchased(userId, cartItemData.materialId);
      if (hasPurchased) {
        return res.status(400).json({ message: "You have already purchased this material" });
      }
      
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.delete('/api/cart/:materialId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const materialId = parseInt(req.params.materialId);
      
      await storage.removeFromCart(userId, materialId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Purchase routes
  app.get('/api/purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Stripe payment route
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing is not configured. Please contact support.",
          code: "PAYMENT_UNAVAILABLE"
        });
      }

      const userId = req.user.claims.sub;
      const { materialIds } = req.body;
      
      if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
        return res.status(400).json({ message: "Invalid material IDs" });
      }
      
      // Get cart items or specific materials
      let items;
      if (materialIds.includes("cart")) {
        items = await storage.getCartItems(userId);
      } else {
        // Get specific materials
        items = [];
        for (const id of materialIds) {
          const material = await storage.getMaterial(id);
          if (material) {
            items.push({ material });
          }
        }
      }
      
      if (items.length === 0) {
        return res.status(400).json({ message: "No items to purchase" });
      }
      
      // Calculate total
      const total = items.reduce((sum, item) => sum + parseFloat(item.material.price), 0);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to the smallest currency unit
        currency: "inr",
        payment_method_types: ["card", "upi"],
        metadata: {
          userId,
          materialIds: JSON.stringify(materialIds),
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: total 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Payment success webhook/confirmation
  app.post("/api/confirm-purchase", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing is not configured. Please contact support.",
          code: "PAYMENT_UNAVAILABLE"
        });
      }

      const userId = req.user.claims.sub;
      const { paymentIntentId, materialIds } = req.body;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }
      
      // Get materials to purchase
      let items;
      if (materialIds.includes("cart")) {
        items = await storage.getCartItems(userId);
      } else {
        items = [];
        for (const id of materialIds) {
          const material = await storage.getMaterial(id);
          if (material) {
            items.push({ material });
          }
        }
      }
      
      // Create purchase records
      const purchases = [];
      for (const item of items) {
        const purchase = await storage.createPurchase({
          userId,
          materialId: item.material.id,
          price: item.material.price,
          stripePaymentIntentId: paymentIntentId,
        });
        purchases.push(purchase);
      }
      
      // Clear cart if purchasing from cart
      if (materialIds.includes("cart")) {
        await storage.clearCart(userId);
      }
      
      res.json({ purchases, message: "Purchase successful" });
    } catch (error) {
      console.error("Error confirming purchase:", error);
      res.status(500).json({ message: "Failed to confirm purchase" });
    }
  });

  // Review routes
  app.get('/api/materials/:id/reviews', async (req, res) => {
    try {
      const materialId = parseInt(req.params.id);
      const reviews = await storage.getReviews(materialId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/materials/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const materialId = parseInt(req.params.id);
      
      // Check if user purchased this material
      const hasPurchased = await storage.hasPurchased(userId, materialId);
      if (!hasPurchased) {
        return res.status(403).json({ message: "You must purchase this material to leave a review" });
      }
      
      // Check if user already reviewed
      const existingReview = await storage.getUserReview(userId, materialId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this material" });
      }
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
        materialId,
      });
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Seed data endpoint (for development)
  app.post('/api/seed', async (req, res) => {
    try {
      // Create sample materials
      const sampleMaterials = [
        {
          title: "Complete .NET Interview Guide",
          description: "Master C#, ASP.NET Core, Entity Framework, and advanced .NET concepts. 200+ questions with detailed explanations.",
          technology: "dotnet",
          difficulty: "intermediate",
          price: "2.99",
          originalPrice: "9.99",
          pages: 150,
          rating: "4.9",
          reviewCount: 234,
          imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          contentUrl: "/content/dotnet-guide.pdf",
          previewUrl: "/content/dotnet-preview.pdf",
        },
        {
          title: "React & Frontend Mastery",
          description: "Comprehensive React, Redux, TypeScript, and modern frontend concepts. Includes practical coding challenges.",
          technology: "react",
          difficulty: "intermediate",
          price: "2.99",
          originalPrice: "8.99",
          pages: 120,
          rating: "4.8",
          reviewCount: 189,
          imageUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          contentUrl: "/content/react-guide.pdf",
          previewUrl: "/content/react-preview.pdf",
        },
        {
          title: "Flutter Mobile Development",
          description: "Master Dart, Flutter widgets, state management, and mobile development best practices for interviews.",
          technology: "flutter",
          difficulty: "intermediate",
          price: "2.99",
          originalPrice: "7.99",
          pages: 100,
          rating: "4.9",
          reviewCount: 156,
          imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          contentUrl: "/content/flutter-guide.pdf",
          previewUrl: "/content/flutter-preview.pdf",
        },
      ];

      for (const material of sampleMaterials) {
        await storage.createMaterial(material);
      }

      res.json({ message: "Sample data created successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Test middleware for admin routes
  const isTestAdmin = (req: any, res: any, next: any) => {
    if ((req.session as any)?.user?.isAdmin) {
      req.user = { claims: { sub: (req.session as any).user.id } };
      return next();
    }
    return res.status(403).json({ message: "Admin access required5" });
  };

  // Admin routes for course management
  app.post('/api/admin/materials', isTestAdmin, async (req, res) => {
    try {
      const materialData = req.body;
      const newMaterial = await storage.createMaterial(materialData);
      res.json(newMaterial);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  app.get('/api/admin/uploads', isTestAdmin, async (req, res) => {
    try {
      const uploads = await storage.getAllUploads();
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ message: "Failed to fetch uploads" });
    }
  });

  app.post('/api/admin/upload', isTestAdmin, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { technology } = req.body;
      if (!technology) {
        return res.status(400).json({ message: "Technology is required" });
      }

      const userId = req.user.claims.sub;
      const uploadData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        technology,
        uploadedBy: userId,
        isActive: true,
      };

      const newUpload = await storage.createUpload(uploadData);
      res.json(newUpload);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete('/api/admin/uploads/:id', isAdmin, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      await storage.deleteUpload(uploadId);
      res.json({ message: "Upload deleted successfully" });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ message: "Failed to delete upload" });
    }
  });

  app.get('/api/admin/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdminUser = await storage.isAdmin(userId);
      res.json({ isAdmin: isAdminUser });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Setup admin route (for initial admin setup)
  app.post('/api/admin/setup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      if (userEmail) {
        await storage.setUserRole(userId, 'admin');
        res.json({ message: "Admin role assigned successfully", userId, email: userEmail });
      } else {
        res.status(400).json({ message: "Email required for admin setup" });
      }
    } catch (error) {
      console.error("Error setting up admin:", error);
      res.status(500).json({ message: "Failed to setup admin" });
    }
  });

  // Simple test login for demo purposes
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/test-login', async (req, res) => {
      try {
        const { username, password } = req.body;
      
      if (username === 'admin' && password === '98123') {
        // Create or get admin user
        const adminUser = await storage.upsertUser({
          id: 'test-admin-001',
          email: 'admin@devinterview.pro',
          firstName: 'Admin',
          lastName: 'User',
          profileImageUrl: null,
        });
        
        // Ensure admin role
        await storage.setUserRole('test-admin-001', 'admin');
        
        // Create a simple token for demo
        const token = Buffer.from(`admin-${Date.now()}`).toString('base64');
        activeSessions.set(token, {
          userId: 'test-admin-001',
          isAdmin: true,
          expires: Date.now() + (24 * 60 * 60 * 1000)
        });
        
        res.json({ 
          success: true, 
          user: { ...adminUser, isAdmin: true },
          message: "Login successful",
          token: token
        });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        }
      } catch (error) {
        console.error("Error in test login:", error);
        res.status(500).json({ success: false, message: "Login failed" });
      }
    });
  }

  // Test logout
  app.post('/api/test-logout', (req, res) => {
    res.clearCookie('auth-token');
    res.json({ message: "Logout successful" });
  });

  // Simple auth check using session storage
  app.get('/api/test-auth/user', async (req, res) => {
    const sessionToken = req.headers['authorization'];
    
    if (sessionToken) {
      const session = activeSessions.get(sessionToken);
      if (session && session.expires > Date.now()) {
        res.json({
          id: session.userId,
          email: 'admin@devinterview.pro',
          firstName: 'Admin',
          lastName: 'User',
          isAdmin: true
        });
        return;
      }
    }
    
    res.status(401).json({ message: "Unauthorized" });
  });

  // Serve uploaded files (with authentication)
  app.use('/uploads', (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  });

//   app.post('/orderss', async (req, res) => {
//   res.json({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });});

 return app;
}
