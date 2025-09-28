import { describe, it, expect, vi, beforeAll } from 'vitest';

let upload: any;

beforeAll(async () => {
  vi.mock('../config.ts', () => ({
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test',
      SESSION_SECRET: 'test',
      DATABASE_URL: 'postgres://test',
    },
    describeConnectionStringForLogs: () => ({ provided: false }),
  }));
  vi.mock('../auth.ts', () => ({
    authMiddleware: (_req: any, _res: any, next: any) => next(),
    requireAuth: (_req: any, _res: any, next: any) => next(),
  }));
  vi.mock('../storage.ts', () => ({
    storage: {
      cleanupExpiredAdminSessions: vi.fn(),
    },
  }));
  ({ upload } = await import('../routes.ts'));
});

describe('file uploads', () => {
  it('accepts PDF files', () => {
    const file = { mimetype: 'application/pdf' } as any;
    const cb = vi.fn();
    upload.fileFilter({}, file, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rejects non-PDF files', () => {
    const file = { mimetype: 'image/png' } as any;
    const cb = vi.fn();
    upload.fileFilter({}, file, cb);
    const err = cb.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
  });
});
