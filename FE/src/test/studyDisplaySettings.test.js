import { describe, expect, it } from 'vitest';
import {
  HAN_VIET_MEANING_STORAGE_KEY,
  readBooleanSetting,
  writeBooleanSetting,
} from '../lib/studyDisplaySettings.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe('Han-Viet meaning setting', () => {
  it('is enabled by default', () => {
    const storage = createStorage();

    expect(readBooleanSetting(storage, HAN_VIET_MEANING_STORAGE_KEY, true)).toBe(true);
  });

  it('is persisted and restored', () => {
    const storage = createStorage();

    writeBooleanSetting(storage, HAN_VIET_MEANING_STORAGE_KEY, false);

    expect(readBooleanSetting(storage, HAN_VIET_MEANING_STORAGE_KEY, true)).toBe(false);
  });
});