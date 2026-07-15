import AsyncStorage from '@react-native-async-storage/async-storage';

const memory = new Map<string, string>();

function isNativeUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Native module is null') ||
    message.includes('legacy storage') ||
    message.includes('AsyncStorage')
  );
}

/**
 * Thin wrapper around AsyncStorage with an in-memory fallback when the native
 * module is not linked yet (e.g. after npm install without a rebuild).
 */
export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (isNativeUnavailable(error)) {
        return memory.get(key) ?? null;
      }
      throw error;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      memory.set(key, value);
    } catch (error) {
      if (isNativeUnavailable(error)) {
        memory.set(key, value);
        return;
      }
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      memory.delete(key);
    } catch (error) {
      if (isNativeUnavailable(error)) {
        memory.delete(key);
        return;
      }
      throw error;
    }
  },
};
