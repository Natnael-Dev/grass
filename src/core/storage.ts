import type { MoodName } from './types';

export const STORAGE_KEYS = {
  MOOD: 'grass:mood',
  MUTED: 'grass:muted',
  HINTS_SEEN: 'grass:hints-seen',
} as const;

export class SafeStorage {
  private memoryFallback = new Map<string, string>();
  private storageAvailable: boolean;

  constructor(
    private storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null,
  ) {
    this.storageAvailable = this.testAvailability();
  }

  private testAvailability(): boolean {
    if (!this.storage) return false;
    try {
      const testKey = '__grass_test__';
      this.storage.setItem(testKey, '1');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string, fallback: string | null = null): string | null {
    if (this.storageAvailable && this.storage) {
      try {
        const val = this.storage.getItem(key);
        return val !== null ? val : fallback;
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryFallback.has(key) ? (this.memoryFallback.get(key) ?? fallback) : fallback;
  }

  public setItem(key: string, value: string): boolean {
    this.memoryFallback.set(key, value);
    if (this.storageAvailable && this.storage) {
      try {
        this.storage.setItem(key, value);
        return true;
      } catch {
        // Storage full or restricted; memory fallback holds value
        return false;
      }
    }
    return true;
  }

  public removeItem(key: string): boolean {
    this.memoryFallback.delete(key);
    if (this.storageAvailable && this.storage) {
      try {
        this.storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  public clear(): void {
    this.memoryFallback.clear();
    if (this.storageAvailable && this.storage) {
      try {
        this.storage.removeItem(STORAGE_KEYS.MOOD);
        this.storage.removeItem(STORAGE_KEYS.MUTED);
        this.storage.removeItem(STORAGE_KEYS.HINTS_SEEN);
      } catch {
        // Ignore
      }
    }
  }

  // App-specific helpers
  public getSavedMood(): MoodName | null {
    const val = this.getItem(STORAGE_KEYS.MOOD);
    if (val === 'dawn' || val === 'golden' || val === 'night') {
      return val;
    }
    return null;
  }

  public setSavedMood(mood: MoodName): void {
    this.setItem(STORAGE_KEYS.MOOD, mood);
  }

  public getSavedMuted(): boolean {
    return this.getItem(STORAGE_KEYS.MUTED) === 'true';
  }

  public setSavedMuted(muted: boolean): void {
    this.setItem(STORAGE_KEYS.MUTED, muted ? 'true' : 'false');
  }

  public getHintsSeen(): boolean {
    return this.getItem(STORAGE_KEYS.HINTS_SEEN) === '1';
  }

  public setHintsSeen(seen: boolean): void {
    this.setItem(STORAGE_KEYS.HINTS_SEEN, seen ? '1' : '0');
  }
}

export const safeStorage = new SafeStorage();
