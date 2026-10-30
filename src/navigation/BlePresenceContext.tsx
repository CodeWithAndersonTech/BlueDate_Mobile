import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useLocale } from '../i18n';
import { useBlePresence, PresenceState } from '../hooks/useBlePresence';
import { BleAdvertiserService } from '../services/ble/BleAdvertiserService';
import { useAuth } from './AuthContext';

type BlePresenceContextValue = {
  state: PresenceState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  refresh: () => Promise<void>;
  pollNearby: () => Promise<void>;
  onEnterBackground: () => Promise<void>;
};

const BlePresenceContext = createContext<BlePresenceContextValue | undefined>(
  undefined,
);

/**
 * Advertises + scans while signed in. Nearby does not have to be open.
 * App switcher / Home (process still alive) keeps the native advertiser
 * running so others can still see you. Force-quit does not.
 */
export function BlePresenceProvider({ children }: { children: React.ReactNode }) {
  const { userId, accessToken, isSignedIn } = useAuth();
  const { device } = useLocale();
  const session = useMemo(
    () =>
      isSignedIn && userId
        ? {
            userId,
            accessToken,
            knownDeviceId: device?.id ?? null,
            knownUniqueId: device?.uniqueId ?? null,
          }
        : null,
    [isSignedIn, userId, accessToken, device?.id, device?.uniqueId],
  );
  const presence = useBlePresence(session);
  const presenceRef = useRef(presence);
  presenceRef.current = presence;

  useEffect(() => {
    if (!isSignedIn || !userId) {
      void presenceRef.current.stop();
      return;
    }

    const apply = (state: AppStateStatus) => {
      // Alert / sheet / photo picker only go `inactive`. Tearing BLE
      // down there races native destroy vs start and kills the process.
      // `background` is the app switcher / Home — keep advertising.
      if (state === 'active') {
        void BleAdvertiserService.setBackgroundKeepAlive(false);
        void presenceRef.current.start().catch(() => undefined);
        return;
      }
      if (state === 'background') {
        void BleAdvertiserService.setBackgroundKeepAlive(true);
        void presenceRef.current.onEnterBackground().catch(() => undefined);
      }
    };

    apply(AppState.currentState);
    const sub = AppState.addEventListener('change', apply);
    return () => {
      sub.remove();
      void presenceRef.current.stop().catch(() => undefined);
    };
  }, [isSignedIn, userId]);

  return (
    <BlePresenceContext.Provider value={presence}>
      {children}
    </BlePresenceContext.Provider>
  );
}

const idlePresence: BlePresenceContextValue = {
  state: {
    status: 'idle',
    deviceId: null,
    advertising: false,
    direct: [],
    bridge: [],
    lastSyncAt: null,
    errorMessage: null,
    refreshing: false,
  },
  start: async () => undefined,
  stop: async () => undefined,
  refresh: async () => undefined,
  pollNearby: async () => undefined,
  onEnterBackground: async () => undefined,
};

export function useBlePresenceContext(): BlePresenceContextValue {
  return useContext(BlePresenceContext) ?? idlePresence;
}
