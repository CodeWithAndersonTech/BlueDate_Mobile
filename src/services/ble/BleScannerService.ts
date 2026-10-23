import { Device, State, BleManager } from 'react-native-ble-plx';
import {
  BLE_SERVICE_SHORT,
  BLE_SERVICE_UUID,
  BLE_TOKEN_CHAR_SHORT,
  BLE_TOKEN_CHAR_UUID,
} from '../../config/ble';

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

function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{12,22}$/.test(value);
}

function isOurServiceKey(key: string): boolean {
  const n = key.toLowerCase().replace(/-/g, '');
  return (
    n === BLE_SERVICE_UUID.replace(/-/g, '').toLowerCase() ||
    n === BLE_SERVICE_SHORT ||
    n === `0000${BLE_SERVICE_SHORT}`
  );
}

export class BleScannerService {
  private manager: BleManager;
  private scanning = false;
  private buffer = new Map<string, RawSighting>();
  private gattInflight = new Set<string>();
  private gattCooldown = new Map<string, number>();
  private onSighting: (() => void) | null = null;

  constructor(manager?: BleManager) {
    this.manager = manager ?? new BleManager();
  }

  setOnSighting(cb: (() => void) | null) {
    this.onSighting = cb;
  }

  async waitUntilPoweredOn(timeoutMs = 8000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const state = await this.manager.state();
        if (state === State.PoweredOn) return true;
      } catch {
        return false;
      }
      await new Promise<void>(r => setTimeout(() => r(), 300));
    }
    return false;
  }

  start() {
    if (this.scanning) return;
    this.scanning = true;

    try {
      // Unfiltered: iOS often omits custom UUIDs from the filter match
      // when the advertiser is another iPhone. We accept only our tokens.
      this.manager.startDeviceScan(
        null,
        { allowDuplicates: true },
        (error, device) => {
          if (error) {
            console.warn('[BleScanner]', error.message);
            return;
          }
          if (device) this.handleDevice(device);
        },
      );
    } catch (error) {
      this.scanning = false;
      console.warn('[BleScanner] start failed', error);
    }
  }

  private remember(token: string, device: Device) {
    if (!looksLikeToken(token)) return;
    this.buffer.set(token, {
      token,
      rssi: device.rssi ?? -100,
      txPower: device.txPowerLevel ?? null,
      seenAt: new Date().toISOString(),
    });
    this.onSighting?.();
  }

  private handleDevice(device: Device) {
    const instant = this.extractInstantToken(device);
    if (instant) {
      this.remember(instant, device);
      return;
    }
    if (this.advertisesOurService(device)) {
      void this.readGattToken(device);
    }
  }

  private extractInstantToken(device: Device): string | null {
    const serviceData = device.serviceData;
    if (serviceData) {
      for (const key of Object.keys(serviceData)) {
        if (!isOurServiceKey(key)) continue;
        const token = base64ToUtf8(serviceData[key]).trim();
        if (looksLikeToken(token)) return token;
      }
    }

    const name = (device.localName ?? device.name ?? '').trim();
    if (looksLikeToken(name) && this.advertisesOurService(device)) {
      return name;
    }
    return null;
  }

  private advertisesOurService(device: Device): boolean {
    const uuids = device.serviceUUIDs ?? [];
    if (uuids.some(isOurServiceKey)) return true;
    if (device.serviceData) {
      return Object.keys(device.serviceData).some(isOurServiceKey);
    }
    return false;
  }

  private async readGattToken(device: Device) {
    const id = device.id;
    const now = Date.now();
    const cool = this.gattCooldown.get(id) ?? 0;
    if (cool > now || this.gattInflight.has(id)) return;
    this.gattInflight.add(id);
    this.gattCooldown.set(id, now + 8_000);

    try {
      const connected = await this.manager.connectToDevice(id, {
        timeout: 4500,
      });
      await connected.discoverAllServicesAndCharacteristics();
      const raw =
        (await this.readChar(connected, BLE_SERVICE_UUID, BLE_TOKEN_CHAR_UUID)) ??
        (await this.readChar(connected, BLE_SERVICE_SHORT, BLE_TOKEN_CHAR_SHORT));
      try {
        await connected.cancelConnection();
      } catch {
        // already disconnected
      }
      if (raw) {
        this.remember(raw, device);
      }
    } catch (error) {
      console.warn(
        '[BleScanner] gatt',
        error instanceof Error ? error.message : String(error),
      );
      try {
        await device.cancelConnection();
      } catch {
        // ignore
      }
    } finally {
      this.gattInflight.delete(id);
    }
  }

  private async readChar(
    device: Device,
    service: string,
    characteristic: string,
  ): Promise<string | null> {
    try {
      const char = await device.readCharacteristicForService(
        service,
        characteristic,
      );
      if (!char.value) return null;
      const token = base64ToUtf8(char.value).trim();
      return looksLikeToken(token) ? token : null;
    } catch {
      return null;
    }
  }

  drainBuffer(): RawSighting[] {
    const items = Array.from(this.buffer.values());
    this.buffer.clear();
    return items;
  }

  stop() {
    if (!this.scanning) return;
    this.scanning = false;
    try {
      this.manager.stopDeviceScan();
    } catch (error) {
      console.warn('[BleScanner] stop failed', error);
    }
  }

  destroy() {
    this.stop();
    this.onSighting = null;
    this.gattInflight.clear();
    try {
      this.manager.destroy();
    } catch (error) {
      console.warn('[BleScanner] destroy failed', error);
    }
  }
}
