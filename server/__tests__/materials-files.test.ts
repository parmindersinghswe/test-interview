import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

describe('material file endpoints', () => {
  let app: express.Express;
  let storageMock: Record<string, any>;
  let testFilePath: string;
  let testFileBuffer: Buffer;

  beforeEach(async () => {
    vi.resetModules();

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    testFileBuffer = Buffer.from('%PDF-1.4 test file');
    testFilePath = path.join(uploadsDir, `material-${Date.now()}-${Math.random()}.pdf`);
    fs.writeFileSync(testFilePath, testFileBuffer);

    storageMock = {
      cleanupExpiredAdminSessions: vi.fn(),
      createAdminSession: vi.fn(),
      getAdminSession: vi.fn(),
      deleteAdminSession: vi.fn(),
      getUser: vi.fn(),
      upsertUser: vi.fn(),
      getUserByEmail: vi.fn(),
      createUserWithPassword: vi.fn(),
      validateUserPassword: vi.fn(),
      getAllMaterials: vi.fn(),
      getMaterial: vi.fn(),
      searchMaterials: vi.fn(),
      createMaterial: vi.fn(),
      deleteMaterial: vi.fn(),
      getCartItems: vi.fn(),
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      getPurchases: vi.fn(),
      getAllPurchases: vi.fn(),
      createPurchase: vi.fn(),
      hasPurchased: vi.fn(),
      getReviews: vi.fn(),
      createReview: vi.fn(),
      getUserReview: vi.fn(),
      getAllUploads: vi.fn(),
      getUploadsByTechnology: vi.fn(),
      getUpload: vi.fn(),
      createUpload: vi.fn(),
      deleteUpload: vi.fn(),
      updateUploadStatus: vi.fn(),
      setUserRole: vi.fn(),
      isAdmin: vi.fn(),
    } satisfies Record<string, any>;

    storageMock.getMaterial.mockResolvedValue({
      id: 1,
      title: 'Test Material',
      contentUrl: '/api/download/upload/42',
    });
    storageMock.hasPurchased.mockResolvedValue(true);
    storageMock.getUpload.mockResolvedValue({
      id: 42,
      filePath: testFilePath,
      mimeType: 'application/pdf',
      originalName: 'source.pdf',
    });
    storageMock.getUser.mockResolvedValue({ id: 'user-123', role: 'user' });
    storageMock.isAdmin.mockResolvedValue(false);

    await vi.doMock('../storage.ts', () => ({ storage: storageMock }));
    await vi.doMock('../config.ts', () => ({
      env: {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-secret',
        SESSION_SECRET: 'test-session',
        DATABASE_URL: 'postgres://test',
        RAZORPAY_KEY_ID: 'key',
        RAZORPAY_KEY_SECRET: 'secret',
      },
      describeConnectionStringForLogs: () => ({ provided: false }),
    }));
    await vi.doMock('../logger.ts', () => ({
      default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
    }));

    const verifyAccessToken = vi.fn(async (token: string) => (token === 'valid-token' ? 'user-123' : null));
    await vi.doMock('../auth.ts', () => ({
      authMiddleware: (req: any, _res: any, next: any) => {
        req.userId = 'user-123';
        req.authUser = { id: 'user-123' };
        next();
      },
      requireAuth: (_req: any, _res: any, next: any) => next(),
      requireAdmin: (_req: any, _res: any, next: any) => next(),
      createAuthTokens: vi.fn(),
      refreshAuthTokens: vi.fn(),
      revokeRefreshToken: vi.fn(),
      getCookie: vi.fn(),
      verifyAccessToken,
    }));

    await vi.doMock('clamscan', () => ({
      default: vi.fn(() => ({
        init: vi.fn().mockResolvedValue({
          scanBuffer: vi.fn().mockResolvedValue({ isInfected: false }),
        }),
      })),
    }));

    await vi.doMock('../db.ts', () => ({ db: {}, pool: {} }));
    await vi.doMock('@aws-sdk/client-s3', () => ({
      S3Client: vi.fn(),
      PutObjectCommand: vi.fn(),
      GetObjectCommand: vi.fn(),
    }));

    const { registerRoutes } = await import('../routes.ts');
    app = express();
    await registerRoutes(app);
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    vi.clearAllMocks();
  });

  it('downloads stored file after purchase verification', async () => {
    const response = await request(app).get('/api/materials/1/download');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(Buffer.compare(response.body, testFileBuffer)).toBe(0);
  });

  it('streams stored file inline for view endpoint', async () => {
    const response = await request(app).get('/api/materials/1/view?token=valid-token');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toContain('inline');
    expect(Buffer.compare(response.body, testFileBuffer)).toBe(0);
  });

  it('returns 404 when upload metadata is missing', async () => {
    storageMock.getUpload.mockResolvedValueOnce(undefined);

    const response = await request(app).get('/api/materials/1/download');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('File not found');
  });
});

