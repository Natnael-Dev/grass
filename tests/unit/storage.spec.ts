import { describe, it, expect, beforeEach } from 'vitest';
import { SafeStorage, STORAGE_KEYS } from '../../src/core/storage';

class MockStorage implements Storage {
  private data = new Map<string, string>();
  public shouldThrow = false;

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    if (this.shouldThrow) throw new Error('Quota exceeded');
    this.data.clear();
  }

  getItem(key: string): string | null {
    if (this.shouldThrow) throw new Error('SecurityError');
    return this.data.has(key) ? (this.data.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    if (this.shouldThrow) throw new Error('SecurityError');
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrow) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
}

describe('SafeStorage', () => {
  let mock: MockStorage;

  beforeEach(() => {
    mock = new MockStorage();
  });

  it('reads and writes values to underlying storage when available', () => {
    const storage = new SafeStorage(mock);
    expect(storage.getItem('test')).toBeNull();
    storage.setItem('test', 'value123');
    expect(storage.getItem('test')).toBe('value123');
    expect(mock.getItem('test')).toBe('value123');
    storage.removeItem('test');
    expect(storage.getItem('test')).toBeNull();
  });

  it('falls back to in-memory store when storage is null', () => {
    const storage = new SafeStorage(null);
    expect(storage.getItem('foo')).toBeNull();
    storage.setItem('foo', 'bar');
    expect(storage.getItem('foo')).toBe('bar');
    storage.removeItem('foo');
    expect(storage.getItem('foo')).toBeNull();
  });

  it('falls back gracefully when storage throws on access', () => {
    mock.shouldThrow = true;
    const storage = new SafeStorage(mock);
    // Since mock.shouldThrow was true during construction test, storageAvailable becomes false
    expect(storage.getItem('hello')).toBeNull();
    storage.setItem('hello', 'world');
    expect(storage.getItem('hello')).toBe('world');
  });

  it('manages typed app helpers (mood, muted, hintsSeen)', () => {
    const storage = new SafeStorage(mock);
    expect(storage.getSavedMood()).toBeNull();
    expect(storage.getSavedMuted()).toBe(false);
    expect(storage.getHintsSeen()).toBe(false);

    storage.setSavedMood('night');
    expect(storage.getSavedMood()).toBe('night');
    expect(mock.getItem(STORAGE_KEYS.MOOD)).toBe('night');

    storage.setSavedMuted(true);
    expect(storage.getSavedMuted()).toBe(true);
    expect(mock.getItem(STORAGE_KEYS.MUTED)).toBe('true');

    storage.setHintsSeen(true);
    expect(storage.getHintsSeen()).toBe(true);
    expect(mock.getItem(STORAGE_KEYS.HINTS_SEEN)).toBe('1');

    storage.clear();
    expect(storage.getSavedMood()).toBeNull();
    expect(storage.getSavedMuted()).toBe(false);
    expect(storage.getHintsSeen()).toBe(false);
  });
});
