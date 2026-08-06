import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NEARBY_POLL_INTERVAL_MS,
  SIGHTINGS_FLUSH_INTERVAL_MS,
  TOKEN_REFRESH_INTERVAL_MS,
} from '../config/ble';
import {
  BridgeNearbyItem,
  DirectNearbyItem,
  fetchNearbyProximity,
  submitBleSightings,
} from '../api/proximity';
import { BleAdvertiserService } from '../services/ble/BleAdvertiserService';
import { BleIdentityService, BleSession } from '../services/ble/BleIdentityService';
import { requestBlePermissions } from '../services/ble/BlePermissions';
import { BleScannerService } from '../services/ble/BleScannerService';

export type PresenceStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'permission_denied'
  | 'error';

export interface PresenceState {
  status: PresenceStatus;
  deviceId: number | null;
  advertising: boolean;
  direct: DirectNearbyItem[];
  bridge: BridgeNearbyItem[];
  lastSyncAt: string | null;
  errorMessage: string | null;
  refreshing: boolean;
}

const initialState: PresenceState = {
  status: 'idle',
  deviceId: null,
  advertising: false,
  direct: [],
  bridge: [],
  lastSyncAt: null,
  errorMessage: null,
  refreshing: false,
};

export function useBlePresence(session: BleSession | null) {
  const [state, setState] = useState<PresenceState>(initialState);

  const scannerRef = useRef<BleScannerService | null>(null);
  const deviceIdRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const startedRef = useRef(false);

  sessionRef.current = session;

  const patch = useCallback((p: Partial<PresenceState>) => {
    setState(prev => ({ ...prev, ...p }));
  }, []);

  const refreshToken = useCallback(async () => {
    const current = sessionRef.current;
    const deviceId = deviceIdRef.current;
    if (!current || !deviceId) return;
    try {
      const token = await BleIdentityService.createToken(current, deviceId);
      const advertising = await BleAdvertiserService.start(token.token);
      patch({
        advertising,
        errorMessage: advertising
          ? null
          : 'Bluetooth yayını başlatılamadı (advertising).',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('[useBlePresence] token refresh', message);
      patch({
        advertising: false,
        errorMessage: `BLE token/API: ${message}`,
      });
    }
  }, [patch]);

  const flushSightings = useCallback(async () => {
    const scanner = scannerRef.current;
    const deviceId = deviceIdRef.current;
    const current = sessionRef.current;
    if (!scanner || !deviceId || !current) return;

    const items = scanner.drainBuffer();
    if (items.length === 0) return;

    try {
      await submitBleSightings({
        userId: current.userId,
        observerDeviceId: deviceId,
        token: current.accessToken,
        items: items.map(i => ({
          SeenToken: i.token,
          Rssi: i.rssi,
          TxPower: i.txPower,
          SeenAt: i.seenAt,
        })),
      });
      patch({ lastSyncAt: new Date().toISOString(), errorMessage: null });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('[useBlePresence] sightings', message);
      patch({ errorMessage: `Sightings API: ${message}` });
    }
  }, [patch]);

  const pollNearby = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      const res = await fetchNearbyProximity({
        userId: current.userId,
        token: current.accessToken,
      });
      patch({ direct: res.Direct, bridge: res.Bridge });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('[useBlePresence] nearby', message);
      patch({ errorMessage: `Nearby API: ${message}` });
    }
  }, [patch]);

  const refresh = useCallback(async () => {
    patch({ refreshing: true });
    try {
      // Soft refresh only — do NOT call resetProximity here. Reset wipes
      // edges/sightings and is why peers briefly appear then vanish on pull.
      await flushSightings();
      await pollNearby();
    } finally {
      patch({ refreshing: false });
    }
  }, [flushSightings, patch, pollNearby]);

  const start = useCallback(async () => {
    const current = sessionRef.current;
    if (!current?.userId || startedRef.current) return;
    startedRef.current = true;
    patch({ status: 'starting', errorMessage: null });

    const granted = await requestBlePermissions();
    if (!granted) {
      patch({ status: 'permission_denied' });
      startedRef.current = false;
      return;
    }

    try {
      const deviceId = await BleIdentityService.resolveDeviceId(current);
      deviceIdRef.current = deviceId;
      patch({ deviceId });

      const scanner = new BleScannerService();
      scannerRef.current = scanner;
      const powered = await scanner.waitUntilPoweredOn();
      if (!powered) {
        throw new Error('Bluetooth is not powered on');
      }
      scanner.start();

      await refreshToken();

      timers.current.push(setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS));
      timers.current.push(
        setInterval(flushSightings, SIGHTINGS_FLUSH_INTERVAL_MS),
      );
      timers.current.push(setInterval(pollNearby, NEARBY_POLL_INTERVAL_MS));

      await pollNearby();
      patch({ status: 'running' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown BLE error';
      patch({ status: 'error', errorMessage: message });
      startedRef.current = false;
    }
  }, [flushSightings, patch, pollNearby, refreshToken]);

  const stop = useCallback(async () => {
    timers.current.forEach(clearInterval);
    timers.current = [];
    await BleAdvertiserService.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
    deviceIdRef.current = null;
    startedRef.current = false;
    patch({ status: 'idle', advertising: false, deviceId: null });
  }, [patch]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearInterval);
      BleAdvertiserService.stop();
      scannerRef.current?.destroy();
    };
  }, []);

  return { state, start, stop, refresh, pollNearby };
}
