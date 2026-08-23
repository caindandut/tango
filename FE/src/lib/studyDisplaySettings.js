export const HAN_VIET_MEANING_STORAGE_KEY = 'tango_show_han_viet_meaning';

export function readBooleanSetting(storage, key, defaultValue) {
  const saved = storage?.getItem(key);
  return saved === null ? defaultValue : saved === 'true';
}

export function writeBooleanSetting(storage, key, value) {
  storage?.setItem(key, String(value));
}
