import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Express } from 'express';

const defaultEnv = {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret',
  SESSION_SECRET: 'test-session',
  DATABASE_URL: 'postgres://test',
  RAZORPAY_KEY_ID: 'rzp_test',
  RAZORPAY_KEY_SECRET: 'secret',
  CLAMAV_HOST: undefined,
  CLAMAV_PORT: undefined,
  AWS_S3_BUCKET: undefined,
  AWS_S3_REGION: undefined,
};

type MockFn = ReturnType<typeof vi.fn>;

type StorageMock = Record<string, MockFn> & {
  validateUserPassword: MockFn;
  createPurchase: MockFn;
  upsertUser: MockFn;
  hasPurchased: MockFn;
  getMaterial: MockFn;
  getUpload: MockFn;
};

type AuthMock = {
  authMiddleware: MockFn;
  requireAuth: MockFn;
  createAuthTokens: MockFn;
  refreshAuthTokens: MockFn;
  revokeRefreshToken: MockFn;
  verifyAccessToken: MockFn;
  getCookie: MockFn;
};

function createStorageMock(): StorageMock {
  return {
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
  } as StorageMock;
}

function createAuthMock(): AuthMock {
  return {
    authMiddleware: vi.fn((_req: any, _res: any, next: any) => next()),
    requireAuth: vi.fn((_req: any, _res: any, next: any) => next()),
    createAuthTokens: vi.fn(),
    refreshAuthTokens: vi.fn(),
    revokeRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    getCookie: vi.fn(),
  } as AuthMock;
}

function createLoggerMock() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
}

type SetupResult = {
  app: Express;
  storageMock: StorageMock;
  authMock: AuthMock;
  razorpayMock: MockFn;
};

async function setupTestApp(): Promise<SetupResult> {
  vi.resetModules();

  const storageMock = createStorageMock();
  const authMock = createAuthMock();
  const loggerMock = createLoggerMock();

  const razorpayInstance = {
    orders: { create: vi.fn().mockResolvedValue({ id: 'order', amount: 1000 }) },
    payments: { fetch: vi.fn().mockResolvedValue({ amount: 1000 }) },
  };
  const razorpayMock = vi.fn(() => razorpayInstance);

  const nodeClamInit = vi.fn().mockResolvedValue({
    scanBuffer: vi.fn().mockResolvedValue({ isInfected: false }),
  });
  const nodeClamMock = vi.fn().mockImplementation(() => ({ init: nodeClamInit }));

  await vi.doMock('../storage.ts', () => ({ storage: storageMock }));
  await vi.doMock('../config.ts', () => ({
    env: { ...defaultEnv },
    describeConnectionStringForLogs: () => ({ provided: false }),
  }));
  await vi.doMock('../logger.ts', () => ({ default: loggerMock }));
  await vi.doMock('../db.ts', () => ({ db: {}, pool: {} }));
  await vi.doMock('clamscan', () => ({ default: nodeClamMock }));
  await vi.doMock('razorpay', () => ({ default: razorpayMock }));
  await vi.doMock('@aws-sdk/client-s3', () => ({
    S3Client: vi.fn(() => ({ send: vi.fn() })),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
  }));
  await vi.doMock('../auth.ts', () => authMock);

  const { registerRoutes } = await import('../routes.ts');
  const app = express();
  app.use(express.json());
  await registerRoutes(app);

  return { app, storageMock, authMock, razorpayMock };
}

afterEach(() => {
  vi.clearAllMocks();
});

function expectSetCookieHeader(setCookie: string[] | undefined, name: string) {
  expect(setCookie).toBeDefined();
  expect(setCookie!.some((cookie) => cookie.startsWith(`${name}=`))).toBe(true);
}

describe('authentication routes', () => {
  it('logs in users and sets auth cookies', async () => {
    const { app, storageMock, authMock } = await setupTestApp();
    const user = {
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    };

    storageMock.validateUserPassword.mockResolvedValue(user);
    authMock.createAuthTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });

    expect(response.status).toBe(200);
    expect(storageMock.validateUserPassword).toHaveBeenCalledWith(
      user.email,
      'password123',
    );
    expect(authMock.createAuthTokens).toHaveBeenCalledWith(user);

    const cookies = response.headers['set-cookie'];
    expectSetCookieHeader(cookies, 'accessToken');
    expectSetCookieHeader(cookies, 'refreshToken');

    expect(response.body.user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isAdmin: false,
    });
  });

  it('rejects requests missing the password', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Password is required');
    expect(storageMock.validateUserPassword).not.toHaveBeenCalled();
    expect(authMock.createAuthTokens).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid credentials', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    storageMock.validateUserPassword.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
    expect(authMock.createAuthTokens).not.toHaveBeenCalled();
  });
});

describe('purchase recording', () => {
  it('records purchases for authenticated users', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    authMock.verifyAccessToken.mockResolvedValue('user-123');
    storageMock.createPurchase.mockResolvedValue({
      id: 1,
      userId: 'user-123',
      materialId: 42,
      price: '9.99',
    });

    const response = await request(app)
      .post('/api/record-purchase')
      .set('Authorization', 'Bearer valid-token')
      .send({ materialId: '42', paymentAmount: '9.99' });

    expect(response.status).toBe(200);
    expect(authMock.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(storageMock.createPurchase).toHaveBeenCalledWith({
      userId: 'user-123',
      materialId: 42,
      price: '9.99',
      razorpayPaymentId: null,
      razorpayOrderId: null,
      razorpaySignature: null,
    });
    expect(storageMock.upsertUser).not.toHaveBeenCalled();
    expect(response.body.success).toBe(true);
  });

  it('creates temporary users for guest purchases and applies fallback price', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    authMock.verifyAccessToken.mockResolvedValue(null);
    storageMock.upsertUser.mockResolvedValue({
      id: 'anon-001',
      email: 'guest@example.com',
    });
    storageMock.createPurchase.mockResolvedValue({
      id: 2,
      userId: 'anon-001',
      materialId: 7,
      price: '2.99',
    });

    const response = await request(app)
      .post('/api/record-purchase')
      .send({ materialId: '7', customerEmail: 'guest@example.com' });

    expect(response.status).toBe(200);
    const upsertArgs = storageMock.upsertUser.mock.calls[0][0];
    expect(upsertArgs.id).toMatch(/^anonymous-/);
    expect(upsertArgs.email).toBe('guest@example.com');

    const purchaseArgs = storageMock.createPurchase.mock.calls[0][0];
    expect(purchaseArgs.userId).toBe('anon-001');
    expect(purchaseArgs.materialId).toBe(7);
    expect(purchaseArgs.price).toBe('2.99');
    expect(response.body.success).toBe(true);
  });
});

describe('file download requirements', () => {
  it('requires authentication before downloading', async () => {
    const { app, storageMock } = await setupTestApp();

    const response = await request(app).get('/api/materials/5/download');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
    expect(storageMock.hasPurchased).not.toHaveBeenCalled();
  });

  it('requires a recorded purchase to continue', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    authMock.authMiddleware.mockImplementation((req: any, _res: any, next: any) => {
      req.userId = 'user-123';
      next();
    });
    storageMock.hasPurchased.mockResolvedValue(false);

    const response = await request(app).get('/api/materials/5/download');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Purchase required to download this material');
    expect(storageMock.hasPurchased).toHaveBeenCalledWith('user-123', 5);
  });

  it('returns 404 when the material is missing', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    authMock.authMiddleware.mockImplementation((req: any, _res: any, next: any) => {
      req.userId = 'user-123';
      next();
    });
    storageMock.hasPurchased.mockResolvedValue(true);
    storageMock.getMaterial.mockResolvedValue(undefined);

    const response = await request(app).get('/api/materials/5/download');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Material not found');
  });

  it('returns 404 when stored file metadata is unavailable', async () => {
    const { app, storageMock, authMock } = await setupTestApp();

    authMock.authMiddleware.mockImplementation((req: any, _res: any, next: any) => {
      req.userId = 'user-123';
      next();
    });
    storageMock.hasPurchased.mockResolvedValue(true);
    storageMock.getMaterial.mockResolvedValue({
      id: 5,
      title: 'Missing file',
      contentUrl: '/api/download/upload/77',
    });
    storageMock.getUpload.mockResolvedValue(null);

    const response = await request(app).get('/api/materials/5/download');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('File not found');
  });
});
