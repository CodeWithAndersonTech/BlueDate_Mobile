import { NativeModules, Platform } from 'react-native';
import { BLE_SERVICE_UUID } from '../../config/ble';

interface BleAdvertiserNative {
  startAdvertising(serviceUuid: string, token: string): Promise<boolean>;
  stopAdvertising(): Promise<boolean>;
  isSupported(): Promise<boolean>;
}

const Native: BleAdvertiserNative | undefined = NativeModules.BleAdvertiser;

export const BleAdvertiserService = {
  isAvailable(): boolean {
    return !!Native;
  },

  async isSupported(): Promise<boolean> {
    if (!Native) return false;
    try {
      return await Native.isSupported();
    } catch {
      return false;
    }
  },

  async start(token: string): Promise<boolean> {
    if (!Native) {
      console.warn(
        `[BleAdvertiser] native module missing (platform=${Platform.OS})`,
      );
      return false;
    }
    try {
      return await Native.startAdvertising(BLE_SERVICE_UUID, token);
    } catch (e) {
      console.warn('[BleAdvertiser] start failed', e);
      return false;
    }
  },

  async stop(): Promise<void> {
    if (!Native) return;
    try {
      await Native.stopAdvertising();
    } catch (e) {
      console.warn('[BleAdvertiser] stop failed', e);
    }
  },
};
