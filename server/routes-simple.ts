import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createAuthToken, deleteAuthToken, simpleAuthMiddleware, verifyAuthToken, requireAuth } from "./simpleAuth";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Simple in-memory admin sessions
const adminSessions = new Map<string, any>();

export async function registerSimpleRoutes(app: Express): Promise<Server> {

  // Simple admin login - no complex session middleware
  app.post('/api/admin-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const envUser = process.env.ADMIN_USERNAME || '';
      const envHash = process.env.ADMIN_PASSWORD_HASH || '';

      const passwordValid = await bcrypt.compare(password, envHash);

      if (username === envUser && passwordValid) {
        // Create simple token only after successful validation
        const token = Buffer.from(`admin-${Date.now()}`).toString('base64');
        adminSessions.set(token, {
          userId: 'admin-001',
          isAdmin: true,
          created: Date.now(),
        });

        res.json({
          success: true,
          token,
          user: {
            id: 'admin-001',
            email: 'admin@devinterview.pro',
            firstName: 'Admin',
            lastName: 'User',
            isAdmin: true,
          },
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });

  // Check admin auth
  app.get('/api/admin-user', (req, res) => {
    const token = req.headers['authorization'];

    if (token && adminSessions.has(token)) {
      const session = adminSessions.get(token);
      res.json({
        id: session.userId,
        email: 'admin@devinterview.pro',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Admin logout
  app.post('/api/admin-logout', (req, res) => {
    const token = req.headers['authorization'];
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ message: "Logged out" });
  });

  // User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Create new user
      const user = await storage.createUserWithPassword({
        email,
        password,
        firstName,
        lastName,
      });

      // Create auth token
      const token = createAuthToken(user);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate user credentials
      const user = await storage.validateUserPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create auth token
      const token = createAuthToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isAdmin: user.role === 'admin'
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // User Logout
  app.post('/api/auth/logout', simpleAuthMiddleware, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        console.log("Signing.. Out...")
        deleteAuthToken(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get current user
  app.get('/api/auth/user', simpleAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAdmin: user.role === 'admin'
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin check endpoint
  app.get('/api/admin/check', simpleAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);

      if (user && user.role === 'admin') {
        res.json({ isAdmin: true });
      } else {
        res.status(403).json({ isAdmin: false, message: "Access denied" });
      }
    } catch (error) {
      res.status(403).json({ isAdmin: false, message: "Access denied" });
    }
  });

  // Admin middleware to check authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers['authorization']?.replace('Bearer ', '');
      console.log(token);
      const userId = verifyAuthToken(token);

      if (!userId) {
        return res.status(403).json({ message: "Admin access required1" });
      }

      const user = await storage.getUser(userId);
      console.log(user);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required2" });
      }

      req.userId = userId;
      next();
    } catch (error) {
      return res.status(403).json({ message: "Admin access required3" });
    }
  };

  // Middleware to ensure user purchased material linked to an upload
  const requirePurchaseForUpload = async (req: any, res: any, next: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { uploadId } = req.params;
      const materials = await storage.getAllMaterials();
      const material = materials.find(m => m.contentUrl?.includes(`/api/download/upload/${uploadId}`));

      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const hasPurchased = await storage.hasPurchased(userId, material.id);
      if (!hasPurchased) {
        return res.status(403).json({ message: "Purchase required to download this file" });
      }

      next();
    } catch (error) {
      console.error('Purchase verification error:', error);
      res.status(500).json({ message: "Failed to verify purchase" });
    }
  };

  // Get admin uploads
  app.get('/api/admin/uploads', requireAdmin, async (req, res) => {
    try {
      const uploads = await storage.getAllUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch uploads" });
    }
  });

  // Get all purchases (admin only)
  app.get('/api/admin/purchases', requireAdmin, async (req, res) => {
    try {
      const purchases = await storage.getAllPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching admin purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Configure multer for file uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Upload file endpoint
  app.post('/api/admin/upload', requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { technology, price, pageCount } = req.body;
      if (!technology) {
        return res.status(400).json({ message: "Technology is required" });
      }

       if (!price) {
        return res.status(400).json({ message: "Price is required" });
      }

      if(!pageCount)
      {
        return res.status(400).json({ message: "Number Of Questions is required" });
      }

      const uploadData = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        technology: technology,
        uploadedBy: 'admin-001',
        isActive: true
      };

      const result = await storage.createUpload(uploadData);
const priceFloat = parseFloat(price) || 0; // string → float
const originalPrice = priceFloat + (priceFloat * 15 / 100);

      // Also create a material entry for this upload so users can purchase it
      const materialData = {
        title: `${technology.toUpperCase()} Interview Questions & Answers`,
        description: `Comprehensive ${technology} interview preparation guide with real questions and detailed answers. Perfect for cracking your next interview.`,
        technology: technology.toLowerCase(),
        difficulty: 'intermediate',
        price: price,
        originalPrice: `${originalPrice}`,
        pages: pageCount,
        rating: '4.8',
        reviewCount: 500,
        imageUrl: `/images/${technology.toLowerCase()}-guide.jpg`,
        contentUrl: `/api/download/upload/${result.id}`, // Point to actual uploaded file
        previewUrl: `/preview/${technology.toLowerCase()}-preview.pdf`,
        isActive: true
      };

      await storage.createMaterial(materialData);

      res.json({
        message: "File uploaded successfully and made available for purchase",
        upload: result
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Upload failed: " + (error as Error).message });
    }
  });

  // Download uploaded PDF files (requires auth and purchase)
  app.get('/api/download/upload/:uploadId', simpleAuthMiddleware, requireAuth, requirePurchaseForUpload, async (req, res) => {
    try {
      const { uploadId } = req.params;
      const uploads = await storage.getAllUploads();
      const upload = uploads.find(u => u.id.toString() === uploadId);

      if (!upload) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check if file exists
      if (!fs.existsSync(upload.filePath)) {
        return res.status(404).json({ message: "Physical file not found" });
      }

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${upload.originalName}"`);

      // Send the file using absolute path
      const absolutePath = path.resolve(upload.filePath);
      res.sendFile(absolutePath);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: "Download failed: " + (error as Error).message });
    }
  });

  // Convert upload to material (admin endpoint)
  app.post('/api/admin/convert-upload/:uploadId', requireAdmin, async (req, res) => {
    try {
      const { uploadId } = req.params;
      const uploads = await storage.getAllUploads();
      const upload = uploads.find(u => u.id.toString() === uploadId);

      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      // Check if material already exists for this technology and remove duplicates
      const allMaterials = await storage.getAllMaterials();
      const existingMaterials = allMaterials.filter(m => m.technology.toLowerCase() === upload.technology.toLowerCase());

      // Delete existing materials for this technology
      for (const material of existingMaterials) {
        await storage.deleteMaterial(material.id);
      }

      // Create new material from upload
      const materialData = {
        title: `${upload.technology.toUpperCase()} Interview Questions & Answers`,
        description: `Comprehensive ${upload.technology} interview preparation guide with real questions and detailed answers. Perfect for cracking your next interview.`,
        technology: upload.technology.toLowerCase(),
        difficulty: 'intermediate',
        price: '2.99',
        originalPrice: '5.99',
        pages: 250,
        rating: '4.8',
        reviewCount: 500,
        imageUrl: `/images/${upload.technology.toLowerCase()}-guide.jpg`,
        contentUrl: `/api/download/upload/${upload.id}`,
        previewUrl: `/preview/${upload.technology.toLowerCase()}-preview.pdf`,
        isActive: true
      };

      await storage.createMaterial(materialData);
      res.json({ message: "Upload converted to purchasable material successfully" });
    } catch (error) {
      console.error('Convert upload error:', error);
      res.status(500).json({ message: "Failed to convert upload" });
    }
  });

  // Delete upload endpoint
  app.delete('/api/admin/uploads/:id', requireAdmin, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const uploads = await storage.getAllUploads();
      const upload = uploads.find(u => u.id === uploadId);

      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      // Delete physical file
      if (fs.existsSync(upload.filePath)) {
        fs.unlinkSync(upload.filePath);
      }

      // Delete from database
      await storage.deleteUpload(uploadId);

      res.json({ message: "Upload deleted successfully" });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ message: "Failed to delete upload" });
    }
  });



  app.post('/create-order', async (req, res) => {
    const { amount } = req.body;
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("----------------razor pay instance-----------------------");
    console.log(instance);
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    try {
      const order = await instance.orders.create(options);
      console.log(order);
      res.json({paymentOrder: order, key_id: process.env.RAZORPAY_KEY_ID});
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating order');
    }
  });

  app.get('/api/current-user', async (req: any, res) => {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const authenticatedUserId = verifyAuthToken(token);
    if (authenticatedUserId) {
      userId = authenticatedUserId;
    }
  }

  if (userId) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAdmin: user.role === 'admin'
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
});


  //2) Verify Payment Signature
  app.post('/confirm-success', async (req: any, res) => {
    const { orderCreationId, razorpayPaymentId, razorpaySignature, materialIds, customerEmail } = req.body;
    const authHeader = req.headers.authorization;

    const digest = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderCreationId}|${razorpayPaymentId}`)
      .digest('hex');

    if (digest === razorpaySignature) {
      try {
        
         let userId = 'anonymous-' + Date.now();

      // Check if user is authenticated with email/password system
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const authenticatedUserId = verifyAuthToken(token);
        if (authenticatedUserId) {
          userId = authenticatedUserId;
        }
      }

      // If not authenticated but email provided, create anonymous record
      if (userId.startsWith('anonymous') && customerEmail) {
        try {
          const tempUser = await storage.upsertUser({
            id: userId,
            email: customerEmail,
            firstName: 'Customer',
            lastName: '',
          });
          userId = tempUser.id;
        } catch (e) {
          userId = 'anonymous-' + Date.now();
        }
      }
        
      console.log("paying with user id: ", userId);
        let items = [];
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
        console.log("Items:", items)
        // Create purchase records
        const purchases = [];
        for (const item of items) {
          const purchase = await storage.createPurchase({
            userId,
            materialId: item.material.id,
            price: item.material.price,
            stripePaymentIntentId: razorpayPaymentId,
          });
          purchases.push(purchase);
        }

        // Clear cart if purchasing from cart
        if (materialIds.includes("cart")) {
          await storage.clearCart(userId);
        }
      } catch (error) {
        console.error("Error confirming purchase:", error);
        res.status(500).json({ message: "Failed to confirm purchase" });
      }
      return res.json({ verified: true, msg: 'Payment verified successfully' });
    }
    res.status(400).json({ verified: false, msg: 'Invalid signature' });
  });
  // Get materials with search and filtering
  app.get('/api/materials', async (req, res) => {
    try {
      const { search, technology, difficulty } = req.query;

      if (search || (technology && technology !== 'all') || (difficulty && difficulty !== 'all')) {
        // Use search functionality if any filters are provided (excluding "all" values)
        const materials = await storage.searchMaterials(
          search as string || '',
          (technology as string === 'all') ? '' : (technology as string || ''),
          (difficulty as string === 'all') ? '' : (difficulty as string || '')
        );
        res.json(materials);
      } else {
        // Return all materials if no filters
        const materials = await storage.getAllMaterials();
        res.json(materials);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  // Get user purchases (email/password auth)
  app.get('/api/purchases', simpleAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const purchases = await storage.getPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Download PDF file (requires purchase verification)
  app.get('/api/materials/:id/download', simpleAuthMiddleware, async (req: any, res) => {
    try {
      const materialId = parseInt(req.params.id);
      const userId = req.userId;

      // Verify user has purchased this material
      const hasPurchased = await storage.hasPurchased(userId, materialId);
      if (!hasPurchased) {
        return res.status(403).json({ message: "Purchase required to download this material" });
      }

      // Get material info
      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // For now, serve the test PDF file
      const filePath = path.join(process.cwd(), 'sample-data', 'test-download.pdf');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${material.title}.pdf"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // View PDF file inline (requires purchase verification)
  app.get('/api/materials/:id/view', async (req: any, res) => {
    try {
      const materialId = parseInt(req.params.id);

      // Get token from query parameter or Authorization header
      let token = req.query.token || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify token and get user ID
      const userId = verifyAuthToken(token);
      if (!userId) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Verify user has purchased this material
      const hasPurchased = await storage.hasPurchased(userId, materialId);
      if (!hasPurchased) {
        return res.status(403).json({ message: "Purchase required to view this material" });
      }

      // For now, serve the test PDF file
      const filePath = path.join(process.cwd(), 'sample-data', 'test-download.pdf');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error viewing file:", error);
      res.status(500).json({ message: "Failed to view file" });
    }
  });

  // Record purchase (works for both authenticated and anonymous users)
  app.post('/api/record-purchase', async (req, res) => {
    try {
      const { materialId, customerEmail, paymentAmount } = req.body;
      const authHeader = req.headers.authorization;

      let userId = 'anonymous-' + Date.now();

      // Check if user is authenticated with email/password system
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const authenticatedUserId = verifyAuthToken(token);
        if (authenticatedUserId) {
          userId = authenticatedUserId;
        }
      }

      // If not authenticated but email provided, create anonymous record
      if (userId.startsWith('anonymous') && customerEmail) {
        try {
          const tempUser = await storage.upsertUser({
            id: userId,
            email: customerEmail,
            firstName: 'Customer',
            lastName: '',
          });
          userId = tempUser.id;
        } catch (e) {
          userId = 'anonymous-' + Date.now();
        }
      }

      // Record the purchase
      const purchase = await storage.createPurchase({
        userId,
        materialId: parseInt(materialId),
        price: paymentAmount || '2.99',
        stripePaymentIntentId: null,
      });

      res.json({ success: true, purchase });
    } catch (error) {
      console.error('Error recording purchase:', error);
      res.status(500).json({ message: "Failed to record purchase" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}