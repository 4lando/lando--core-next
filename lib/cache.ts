import fs from 'node:fs';
import path from 'node:path';

interface CacheOptions {
  stdTTL?: number;
  checkperiod?: number;
  useClones?: boolean;
}

interface CacheEntry<T> {
  value: T;
  expires: number | null;
}

export default class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private stdTTL: number;
  private checkperiod: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  
  log: any;
  cacheDir: string;

  constructor(options: CacheOptions = {}) {
    this.stdTTL = options.stdTTL ?? 0;
    this.checkperiod = options.checkperiod ?? 600;
    this.log = console;
    this.cacheDir = '';
    
    if (this.checkperiod > 0) {
      this.timer = setInterval(() => this.checkExpired(), this.checkperiod * 1000);
    }
  }

  private checkExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expires !== null && entry.expires < now) {
        this.store.delete(key);
      }
    }
  }

  private getExpiry(ttl?: number): number | null {
    const effectiveTTL = ttl ?? this.stdTTL;
    return effectiveTTL > 0 ? Date.now() + effectiveTTL * 1000 : null;
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    this.store.set(key, { value, expires: this.getExpiry(ttl) });
    return true;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires !== null && entry.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  del(key: string | string[]): number {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  flushAll(): void {
    this.store.clear();
  }

  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setCache(key: string, data: unknown): boolean {
    const cacheFile = path.join(this.cacheDir, `${key}.json`);
    
    try {
      this.set(key, data);
      this.log.debug?.('Setting cache key %s to memory.', key);
    } catch {
      this.log.debug?.('Failed setting cache key %s to memory.', key);
    }

    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
      this.log.debug?.('Setting cache key %s to disk at %s.', key, cacheFile);
      return true;
    } catch {
      this.log.debug?.('Failed setting cache key %s to disk.', key);
      return false;
    }
  }

  getCache(key: string): unknown {
    const cacheFile = path.join(this.cacheDir, `${key}.json`);
    const memoryData = this.get(key);
    
    if (memoryData !== undefined) {
      this.log.debug?.('Cache key %s retrieved from memory.', key);
      return memoryData;
    }

    try {
      if (fs.existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        this.log.debug?.('Cache key %s retrieved from disk at %s.', key, cacheFile);
        this.set(key, data);
        return data;
      }
      this.log.debug?.('Cache key %s not found on disk.', key);
    } catch {
      this.log.debug?.('Failed reading cache key %s from disk.', key);
    }
    
    return undefined;
  }

  removeCache(key: string): boolean {
    const cacheFile = path.join(this.cacheDir, `${key}.json`);
    
    this.del(key);
    this.log.debug?.('Removed cache key %s from memory.', key);
    
    try {
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        this.log.debug?.('Removed cache file %s.', cacheFile);
      }
      return true;
    } catch {
      this.log.debug?.('Failed removing cache file %s.', cacheFile);
      return false;
    }
  }
}
