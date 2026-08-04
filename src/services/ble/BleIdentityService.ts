import { Platform } from 'react-native';
import { createBleToken, registerBleDevice } from '../../api/proximity';
import { getDeviceLaunchInfo } from '../../utils/deviceInfo';

export type BleSession = {
  userId: number;
  accessToken?: string | null;
  /** Existing bootstrapped device row id when already bound. */
  knownDeviceId?: number | null;
  knownUniqueId?: string | null;
};

/**
 * Registers (or upserts) the current phone for BLE and issues presence tokens.
 * Reuses Locale bootstrap device id when available — no separate login.
 */
export const BleIdentityService = {
  async resolveDeviceId(session: BleSession): Promise<number> {
    if (session.knownDeviceId && session.knownDeviceId > 0) {
      // Still upsert so user_id is bound for BLE token ownership checks.
      const info = await getDeviceLaunchInfo();
      const res = await registerBleDevice({
        userId: session.userId,
        deviceUniqueId: session.knownUniqueId || info.uniqueId,
        platform: info.platform,
        deviceName: `${Platform.OS}-device`,
        osVersion: info.osVersion,
        token: session.accessToken,
      });
      return res.DeviceId || session.knownDeviceId;
    }

    const info = await getDeviceLaunchInfo();
    const res = await registerBleDevice({
      userId: session.userId,
      deviceUniqueId: info.uniqueId,
      platform: info.platform,
      deviceName: `${Platform.OS}-device`,
      osVersion: info.osVersion,
      token: session.accessToken,
    });
    if (!res.DeviceId) {
      throw new Error('BLE device register failed');
    }
    return res.DeviceId;
  },

  async createToken(
    session: BleSession,
    deviceId: number,
  ): Promise<{ token: string; tokenHash: string; validFrom: string; validTo: string }> {
    const res = await createBleToken({
      userId: session.userId,
      deviceId,
      token: session.accessToken,
    });
    if (!res.Token) {
      throw new Error('BLE token create failed');
    }
    return {
      token: res.Token,
      tokenHash: res.TokenHash,
      validFrom: res.ValidFrom,
      validTo: res.ValidTo,
    };
  },
};
