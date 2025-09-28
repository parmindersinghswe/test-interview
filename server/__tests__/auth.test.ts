import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  vi.mock('../config.ts', () => ({
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test',
      SESSION_SECRET: 'test',
      DATABASE_URL: 'postgres://test',
    },
    describeConnectionStringForLogs: () => ({ provided: false }),
  }));
  vi.mock('../db.ts', () => ({ db: {}, pool: {} }));
  vi.mock('../storage.ts', () => ({ storage: {} }));
});

describe('auth utilities', () => {
  it('getCookie returns value when present', async () => {
    const { getCookie } = await import('../auth.ts');
    const req: any = { headers: { cookie: 'foo=bar; fizz=buzz' } };
    expect(getCookie(req, 'fizz')).toBe('buzz');
  });

  it('getCookie returns null when absent', async () => {
    const { getCookie } = await import('../auth.ts');
    const req: any = { headers: {} };
    expect(getCookie(req, 'foo')).toBeNull();
  });
});
