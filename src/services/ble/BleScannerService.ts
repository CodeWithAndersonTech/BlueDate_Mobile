import { BleManager, Device, State } from 'react-native-ble-plx';
import { BLE_SERVICE_UUID } from '../../config/ble';

export interface RawSighting {
  token: string;
  rssi: number;
  txPower?: number | null;
  seenAt: string;
}

function base64ToUtf8(b64: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = b64.replace(/=+$/, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const c of str) {
    const idx = chars.indexOf(c);
    if (idx === -1) continue;
    value = (value << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }
  return bytes.map(b => String.fromCharCode(b)).join('');
}

export class BleScannerService {
  private manager: BleManager;
  private scanning = false;
  private buffer = new Map<string, RawSighting>();

  constructor(manager?: BleManager) {
    this.manager = manager ?? new BleManager();
  }

  async waitUntilPoweredOn(timeoutMs = 8000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const state = await this.manager.state();
      if (state === State.PoweredOn) return true;
      await new Promise<void>(r => setTimeout(() => r(), 300));
    }
    return false;
  }

  start() {
    if (this.scanning) return;
    this.scanning = true;

    this.manager.startDeviceScan(
      [BLE_SERVICE_UUID],
      { allowDuplicates: true },
      (error, device) => {
        if (error) {
          console.warn('[BleScanner]', error.message);
          return;
        }
        if (device) this.handleDevice(device);
      },
    );
  }

  private handleDevice(device: Device) {
    const token = this.extractToken(device);
    if (!token) return;

    this.buffer.set(token, {
      token,
      rssi: device.rssi ?? -100,
      txPower: device.txPowerLevel ?? null,
      seenAt: new Date().toISOString(),
    });
  }

  private extractToken(device: Device): string | null {
    const serviceData = device.serviceData;
    if (serviceData) {
      const key = Object.keys(serviceData).find(
        k => k.toLowerCase() === BLE_SERVICE_UUID.toLowerCase(),
      );
      if (key) {
        const token = base64ToUtf8(serviceData[key]).trim();
        if (token) return token;
      }
    }

    const advertisesOurService = (device.serviceUUIDs ?? []).some(
      u => u.toLowerCase() === BLE_SERVICE_UUID.toLowerCase(),
    );
    if (advertisesOurService) {
      const name = (device.localName ?? device.name ?? '').trim();
      if (name) return name;
    }

    return null;
  }

  drainBuffer(): RawSighting[] {
    const items = Array.from(this.buffer.values());
    this.buffer.clear();
    return items;
  }

  stop() {
    if (!this.scanning) return;
    this.manager.stopDeviceScan();
    this.scanning = false;
  }

  destroy() {
    this.stop();
    this.manager.destroy();
  }
}
