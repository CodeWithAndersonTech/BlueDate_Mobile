/** BLE proximity constants (ported from DemoBle). */

export const BLE_SERVICE_UUID = '0000b1e5-0000-1000-8000-00805f9b34fb';
/** Readable GATT characteristic that carries the presence token on iOS. */
export const BLE_TOKEN_CHAR_UUID = '0000b1e6-0000-1000-8000-00805f9b34fb';
export const BLE_SERVICE_SHORT = 'b1e5';
export const BLE_TOKEN_CHAR_SHORT = 'b1e6';

export const SIGHTINGS_FLUSH_INTERVAL_MS = 2500;
export const TOKEN_REFRESH_INTERVAL_MS = 50_000;
export const NEARBY_POLL_INTERVAL_MS = 2500;
export const SIGHTING_FLUSH_DEBOUNCE_MS = 300;
