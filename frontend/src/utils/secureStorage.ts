import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const isNativePlatform = Capacitor.isNativePlatform();

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isNativePlatform) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isNativePlatform) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isNativePlatform) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (isNativePlatform) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  },

  async getObject<T>(key: string): Promise<T | null> {
    const jsonString = await this.getItem(key);
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error("Error parsing stored object:", error);
      return null;
    }
  },

  isNative(): boolean {
    return isNativePlatform;
  },
};

export default secureStorage;
