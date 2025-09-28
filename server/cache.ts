export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly defaultTtlMs: number) {}

  private now(): number {
    return Date.now();
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return entry.expiresAt <= this.now();
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const hasCustomTtl = typeof ttlMs === 'number' && Number.isFinite(ttlMs);
    const effectiveTtlMs = hasCustomTtl ? ttlMs : this.defaultTtlMs;

    if (!Number.isFinite(effectiveTtlMs) || effectiveTtlMs <= 0) {
      this.store.delete(key);
      return;
    }

    this.store.set(key, {
      value,
      expiresAt: this.now() + effectiveTtlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  pruneExpired(): void {
    const currentTime = this.now();
    this.store.forEach((entry, key) => {
      if (entry.expiresAt <= currentTime) {
        this.store.delete(key);
      }
    });
  }
}
