import { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { InMemoryCache } from "./cache.js";
import { invalidateSitemapCache } from "./sitemap.js";
import {
  createAuthTokens,
  refreshAuthTokens,
  authMiddleware,
  requireAuth,
  verifyAccessToken,
  revokeRefreshToken,
  getCookie,
} from "./auth.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import Razorpay from 'razorpay';
import crypto from 'crypto';
import NodeClam from 'clamscan';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { env } from "./config.js";
import logger from "./logger.js";
import { db } from "./db.js";
import { purchases, type Material } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const secondsToMilliseconds = (seconds: number): number => Math.max(1, Math.floor(seconds * 1000));

const materialsCache = new InMemoryCache<Material[]>(
  secondsToMilliseconds(env.MATERIALS_CACHE_TTL_SECONDS),
);

const clearMaterialDependentCaches = (): void => {
  materialsCache.clear();
  invalidateSitemapCache();
};

type MaterialsCacheKey = {
  search: string;
  technology: string;
  difficulty: string;
  usingFilters: boolean;
};

const buildMaterialsCacheKey = (filters: MaterialsCacheKey): string => JSON.stringify(filters);

const getFirstQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const [first] = value;
    if (typeof first === "string") {
      return first;
    }
  }

  return undefined;
};

// Configure multer for file uploads in memory so files can be scanned
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
export const upload = multer({
  storage: multer.memoryStorage(),
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize malware scanner and optional S3 client
  const clamscan = await new NodeClam().init({
    clamdscan: {
      host: env.CLAMAV_HOST,
      port: env.CLAMAV_PORT ? parseInt(env.CLAMAV_PORT) : undefined,
    },
  }).catch((err: unknown) => {
    logger.error({ err }, 'Failed to initialize ClamAV');
    return null;
  });

  const s3 = env.AWS_S3_BUCKET && env.AWS_S3_REGION
    ? new S3Client({ region: env.AWS_S3_REGION })
    : null;

  const uploadUrlPattern = /\/api\/download\/upload\/(\d+)/;

  const sanitizeFilename = (name: string, fallback = 'download.pdf') => {
    const cleaned = name.replace(/[\r\n"]/g, '').replace(/[\\/]/g, '-').trim();
    return cleaned || fallback;
  };

  const extractUploadId = (url: string | null | undefined): number | null => {
    if (!url) return null;
    const match = uploadUrlPattern.exec(url);
    if (!match) return null;
    const id = Number.parseInt(match[1], 10);
    return Number.isNaN(id) ? null : id;
  };

  type StoredFile = {
    id?: number;
    filePath: string;
    mimeType?: string | null;
    originalName?: string | null;
  };

  const resolveStoredFileFromContentUrl = async (
    contentUrl: string | null | undefined,
  ): Promise<StoredFile | null> => {
    const uploadId = extractUploadId(contentUrl);
    if (uploadId !== null) {
      try {
        const upload = await storage.getUpload(uploadId);
        return upload ?? null;
      } catch (error) {
        logger.error({ error, uploadId }, 'Failed to load upload metadata');
        return null;
      }
    }

    if (!contentUrl || typeof contentUrl !== 'string') {
      return null;
    }

    const trimmed = contentUrl.trim();
    if (!trimmed || trimmed.startsWith('/api/') || /^https?:/i.test(trimmed)) {
      return null;
    }

    return {
      filePath: trimmed,
      mimeType: 'application/pdf',
      originalName: path.basename(trimmed),
    };
  };

  type StreamResult = 'streamed' | 'not_found' | 'error';

  const streamStoredFile = async (
    file: StoredFile,
    res: Response,
    options: { inline: boolean; filename?: string },
  ): Promise<StreamResult> => {
    const filename = sanitizeFilename(
      options.filename ?? file.originalName ?? `download-${file.id ?? 'file'}.pdf`,
    );
    const dispositionType = options.inline ? 'inline' : 'attachment';

    const useS3 = Boolean(s3) && !path.isAbsolute(file.filePath);

    if (useS3) {
      try {
        const data = await s3!.send(
          new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET!,
            Key: file.filePath,
          }),
        );
        const body = data.Body;
        if (body instanceof Readable) {
          res.setHeader('Content-Type', file.mimeType ?? data.ContentType ?? 'application/pdf');
          res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);
          body.on('error', (err) => {
            logger.error({ err, filePath: file.filePath }, 'S3 stream error');
            res.destroy(err as Error);
          });
          body.pipe(res);
          return 'streamed';
        }

        logger.error({ filePath: file.filePath }, 'S3 object missing body stream');
        return 'error';
      } catch (error) {
        logger.error({ error, filePath: file.filePath }, 'S3 download error');
        return 'not_found';
      }
    }

    const absolutePath = path.isAbsolute(file.filePath)
      ? file.filePath
      : path.resolve(process.cwd(), file.filePath);

    if (!fs.existsSync(absolutePath)) {
      return 'not_found';
    }

    res.setHeader('Content-Type', file.mimeType ?? 'application/pdf');
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);

    return await new Promise<StreamResult>((resolve) => {
      res.sendFile(absolutePath, (err) => {
        if (err) {
          const nodeError = err as NodeJS.ErrnoException;
          logger.error({ error: nodeError, filePath: absolutePath }, 'Local file send error');
          resolve(nodeError.code === 'ENOENT' ? 'not_found' : 'error');
        } else {
          resolve('streamed');
        }
      });
    });
  };

  // Simple admin login using persistent sessions
  app.post('/api/admin-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const envUser = env.ADMIN_USERNAME || '';
      const envHash = env.ADMIN_PASSWORD_HASH || '';

      const passwordValid = await bcrypt.compare(password, envHash);

      if (username === envUser && passwordValid) {
        await storage.cleanupExpiredAdminSessions();
        const token = await storage.createAdminSession('admin-001');

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
      logger.error({ error }, 'Login error');
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });

  // Check admin auth
  app.get('/api/admin-user', async (req, res) => {
    const token = req.headers['authorization'];

    if (typeof token === 'string') {
      const session = await storage.getAdminSession(token);
      if (session) {
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

  // Admin logout
  app.post('/api/admin-logout', async (req, res) => {
    const token = req.headers['authorization'];
    if (typeof token === 'string') {
      await storage.deleteAdminSession(token);
    }
    res.json({ message: "Logged out" });
  });

  // User Registration handler
  async function handleUserRegistration(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create new user
      const user = await storage.createUserWithPassword({
        email,
        password,
        firstName,
        lastName,
      });

      const tokens = await createAuthTokens(user);
      const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV !== "development",
        sameSite: "lax" as const,
      };
      res.cookie("accessToken", tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error({ error }, "Registration error");
      res.status(500).json({ message: "Failed to register user" });
    }
  }

  // User Registration
  app.post('/api/auth/register', handleUserRegistration);

  // Legacy registration route for backward compatibility
  app.post('/api/v1/auth/signup', handleUserRegistration);

  // User Login
    async function handleUserLogin(req: Request, res: Response) {
      try {
      const { email, password } = req.body;

      // Ensure credentials are provided
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      // Validate user credentials
      const user = await storage.validateUserPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const tokens = await createAuthTokens(user);
      const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV !== 'development',
        sameSite: 'lax' as const,
      };
      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isAdmin: user.role === 'admin'
        },
      });
    } catch (error) {
      logger.error({ error }, "Login error");
      res.status(500).json({ message: "Failed to login" });
    }
  }

  app.post('/api/auth/login', handleUserLogin);


  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const refreshToken = getCookie(req, 'refreshToken');
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token' });
      }
      const tokens = await refreshAuthTokens(refreshToken);
      if (!tokens) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV !== 'development',
        sameSite: 'lax' as const,
      };
      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ message: 'Tokens refreshed' });
    } catch (error) {
      logger.error({ error }, 'Refresh error');
      res.status(500).json({ message: 'Failed to refresh token' });
    }
  });

  // User Logout
  app.post('/api/auth/logout', authMiddleware, async (req: any, res) => {
    try {
      const refreshToken = getCookie(req, 'refreshToken');
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      logger.error({ error }, "Logout error");
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get current user
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
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
      logger.error({ error }, "Error fetching user");
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin check endpoint
  app.get('/api/admin/check', authMiddleware, async (req: any, res) => {
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
      logger.debug({
        event: 'adminAuthTokenReceived',
        token
      });
      const userId = await verifyAccessToken(token);

      if (!userId) {
        return res.status(403).json({ message: "Admin access required1" });
      }

      const user = await storage.getUser(userId);
      logger.debug({
        event: 'adminAuthUserFetched',
        userId: user?.id,
        role: user?.role,
      });
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

      const uploadIdParam = req.params.uploadId;
      const uploadId = Number.parseInt(uploadIdParam, 10);
      if (Number.isNaN(uploadId)) {
        return res.status(400).json({ message: "Invalid upload ID" });
      }

      const materials = await storage.getAllMaterials();
      const material = materials.find((m) => extractUploadId(m.contentUrl) === uploadId);

      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const hasPurchased = await storage.hasPurchased(userId, material.id);
      if (!hasPurchased) {
        return res.status(403).json({ message: "Purchase required to download this file" });
      }

      next();
    } catch (error) {
      logger.error({ error }, 'Purchase verification error');
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
      logger.error({ error }, "Error fetching admin purchases");
      res.status(500).json({ message: "Failed to fetch purchases" });
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

      if (!pageCount) {
        return res.status(400).json({ message: "Number Of Questions is required" });
      }

      if (!clamscan) {
        return res.status(500).json({ message: "Scanning service unavailable" });
      }

      const scanResult = await clamscan.scanBuffer(req.file.buffer);
      if (scanResult.isInfected) {
        logger.warn({ viruses: scanResult.viruses, file: req.file.originalname }, 'Malicious file detected');
        return res.status(400).json({ message: "Malicious content detected" });
      }

      const baseName = path.basename(req.file.originalname);
      const ext = path.extname(baseName).toLowerCase();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `${req.file.fieldname}-${uniqueSuffix}${ext}`;

      let filePath: string;
      if (s3) {
        const key = `uploads/${filename}`;
        await s3.send(new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET!,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }));
        filePath = key;
      } else {
        const localPath = path.join(uploadDir, filename);
        fs.writeFileSync(localPath, req.file.buffer);
        filePath = localPath;
      }

      const uploadData = {
        originalName: req.file.originalname,
        filename: filename,
        filePath: filePath,
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
      clearMaterialDependentCaches();

      res.json({
        message: "File uploaded successfully and made available for purchase",
        upload: result
      });
    } catch (error) {
      logger.error({ error }, 'Upload error');
      res.status(500).json({ message: "Upload failed: " + (error as Error).message });
    }
  });

  // Download uploaded PDF files (requires auth and purchase)
  app.get('/api/download/upload/:uploadId', authMiddleware, requireAuth, requirePurchaseForUpload, async (req, res) => {
    try {
      const uploadId = Number.parseInt(req.params.uploadId, 10);
      if (Number.isNaN(uploadId)) {
        return res.status(400).json({ message: 'Invalid upload ID' });
      }

      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ message: 'File not found' });
      }

      const result = await streamStoredFile(upload, res, {
        inline: false,
        filename: upload.originalName ?? `upload-${uploadId}.pdf`,
      });

      if (result === 'not_found') {
        return res.status(404).json({ message: 'File not found' });
      }

      if (result === 'error' && !res.headersSent) {
        return res.status(500).json({ message: 'Download failed' });
      }
    } catch (error) {
      logger.error({ error }, 'Download error');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Download failed: ' + (error as Error).message });
      }
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

      if (existingMaterials.length > 0) {
        clearMaterialDependentCaches();
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
      clearMaterialDependentCaches();
      res.json({ message: "Upload converted to purchasable material successfully" });
    } catch (error) {
      logger.error({ error }, 'Convert upload error');
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
      logger.error({ error }, "Error deleting upload");
      res.status(500).json({ message: "Failed to delete upload" });
    }
  });



  app.post('/create-order', async (req, res) => {
    const { amount } = req.body;
    const instance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    try {
      const order = await instance.orders.create(options);
      logger.info({ orderId: order.id }, 'Razorpay order created');
      res.json({paymentOrder: order, key_id: env.RAZORPAY_KEY_ID});
    } catch (err) {
      logger.error(err);
      res.status(500).send('Error creating order');
    }
  });

  app.get('/api/current-user', async (req: any, res) => {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const authenticatedUserId = await verifyAccessToken(token);
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
      logger.error({ error }, "Error fetching user");
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
});


  //2) Verify Payment Signature
  app.post('/confirm-success', async (req: any, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, materialIds, customerEmail } = req.body;
    const authHeader = req.headers.authorization;

    const digest = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({ verified: false, msg: 'Invalid signature' });
    }

    try {
      let userId = 'anonymous-' + Date.now();

      // Check if user is authenticated with email/password system
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const authenticatedUserId = await verifyAccessToken(token);
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

      logger.info({ userId }, "paying with user id");
      let items = [] as any[];
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
      logger.info({ items }, "Items");

      // Validate payment amount with Razorpay API
      const expectedAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.material.price),
        0
      );
      const instance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID!,
        key_secret: env.RAZORPAY_KEY_SECRET!,
      });
      const payment = await instance.payments.fetch(razorpayPaymentId);
      if (payment.status !== 'captured') {
        return res.status(400).json({ verified: false, msg: 'Payment not captured' });
      }

      if (payment.amount !== Math.round(expectedAmount * 100)) {
        return res.status(400).json({ verified: false, msg: 'Amount mismatch' });
      }

      // Create purchase records
      const purchases = [];
      for (const item of items) {
        const purchase = await storage.createPurchase({
          userId,
          materialId: item.material.id,
          price: item.material.price,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
        });
        purchases.push(purchase);
      }

      // Clear cart if purchasing from cart
      if (materialIds.includes("cart")) {
        await storage.clearCart(userId);
      }

      return res.json({ verified: true, msg: 'Payment verified successfully' });
    } catch (error) {
      logger.error({ error }, "Error confirming purchase");
      res.status(500).json({ message: "Failed to confirm purchase" });
    }
  });

  app.post('/razorpay-webhook', async (req, res) => {
    const signatureHeader = req.headers['x-razorpay-signature'];
    if (typeof signatureHeader !== 'string') {
      return res.status(400).json({ message: 'Missing signature' });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: 'Invalid payload format' });
    }

    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET!)
      .update(req.body)
      .digest('hex');

    if (signatureHeader !== expectedSig) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    try {
      const event = JSON.parse(req.body.toString('utf8'));
      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        await db
          .update(purchases)
          .set({
            razorpayPaymentId: payment.id,
            razorpaySignature: signatureHeader,
          })
          .where(eq(purchases.razorpayOrderId, payment.order_id));
      }
      res.json({ status: 'ok' });
    } catch (error) {
      logger.error({ error }, 'Razorpay webhook error');
      res.status(500).json({ message: 'Webhook handling failed' });
    }
  });
  // Get materials with search and filtering
  app.get('/api/materials', async (req, res) => {
    try {
      const searchParam = getFirstQueryValue(req.query.search) ?? '';
      const technologyParamRaw = getFirstQueryValue(req.query.technology);
      const difficultyParamRaw = getFirstQueryValue(req.query.difficulty);

      const normalizedTechnology = technologyParamRaw === 'all' ? '' : (technologyParamRaw ?? '');
      const normalizedDifficulty = difficultyParamRaw === 'all' ? '' : (difficultyParamRaw ?? '');

      const usingFilters =
        Boolean(searchParam) ||
        (technologyParamRaw !== undefined && technologyParamRaw !== 'all') ||
        (difficultyParamRaw !== undefined && difficultyParamRaw !== 'all');

      const cacheKey = buildMaterialsCacheKey({
        search: searchParam,
        technology: normalizedTechnology,
        difficulty: normalizedDifficulty,
        usingFilters,
      });

      const cachedMaterials = materialsCache.get(cacheKey);
      if (cachedMaterials) {
        return res.json(cachedMaterials);
      }

      let materials: Material[];
      if (usingFilters) {
        materials = await storage.searchMaterials(
          searchParam || '',
          normalizedTechnology,
          normalizedDifficulty,
        );
      } else {
        materials = await storage.getAllMaterials();
      }

      materialsCache.set(cacheKey, materials);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  // Get user purchases (email/password auth)
  app.get('/api/purchases', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const purchases = await storage.getPurchases(userId);
      res.json(purchases);
    } catch (error) {
      logger.error({ error }, "Error fetching purchases");
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Download PDF file (requires purchase verification)
  app.get('/api/materials/:id/download', authMiddleware, async (req: any, res) => {
    try {
      const materialId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(materialId)) {
        return res.status(400).json({ message: 'Invalid material ID' });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const hasPurchased = await storage.hasPurchased(userId, materialId);
      if (!hasPurchased) {
        return res.status(403).json({ message: 'Purchase required to download this material' });
      }

      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: 'Material not found' });
      }

      const storedFile = await resolveStoredFileFromContentUrl(material.contentUrl);
      if (!storedFile) {
        return res.status(404).json({ message: 'File not found' });
      }

      const result = await streamStoredFile(storedFile, res, {
        inline: false,
        filename: `${material.title}.pdf`,
      });

      if (result === 'not_found') {
        return res.status(404).json({ message: 'File not found' });
      }

      if (result === 'error' && !res.headersSent) {
        return res.status(500).json({ message: 'Failed to download file' });
      }
    } catch (error) {
      logger.error({ error }, 'Error downloading file');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to download file' });
      }
    }
  });

  // View PDF file inline (requires purchase verification)
  app.get('/api/materials/:id/view', async (req: any, res) => {
    try {
      const materialId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(materialId)) {
        return res.status(400).json({ message: 'Invalid material ID' });
      }

      const tokenParam = req.query.token;
      let token: string | undefined;
      if (Array.isArray(tokenParam)) {
        token = tokenParam[0];
      } else if (typeof tokenParam === 'string') {
        token = tokenParam;
      } else if (typeof req.headers.authorization === 'string') {
        token = req.headers.authorization.replace('Bearer ', '');
      }

      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = await verifyAccessToken(token);
      if (!userId) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      const hasPurchased = await storage.hasPurchased(userId, materialId);
      if (!hasPurchased) {
        return res.status(403).json({ message: 'Purchase required to view this material' });
      }

      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: 'Material not found' });
      }

      const storedFile = await resolveStoredFileFromContentUrl(material.contentUrl);
      if (!storedFile) {
        return res.status(404).json({ message: 'File not found' });
      }

      const result = await streamStoredFile(storedFile, res, {
        inline: true,
        filename: `${material.title}.pdf`,
      });

      if (result === 'not_found') {
        return res.status(404).json({ message: 'File not found' });
      }

      if (result === 'error' && !res.headersSent) {
        return res.status(500).json({ message: 'Failed to view file' });
      }
    } catch (error) {
      logger.error({ error }, 'Error viewing file');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to view file' });
      }
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
        const authenticatedUserId = await verifyAccessToken(token);
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
        razorpayPaymentId: null,
        razorpayOrderId: null,
        razorpaySignature: null,
      });

      res.json({ success: true, purchase });
    } catch (error) {
      logger.error({ error }, 'Error recording purchase');
      res.status(500).json({ message: "Failed to record purchase" });
    }
  });

  app.use('/api', (req, res) => {
    logger.warn(
      { method: req.method, originalUrl: req.originalUrl },
      'Unhandled API route requested',
    );

    res.status(404).json({ message: 'Not Found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}