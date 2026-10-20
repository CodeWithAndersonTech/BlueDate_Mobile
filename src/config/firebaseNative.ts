import { TurboModuleRegistry } from 'react-native';

/**
 * RN Firebase v26 registers NativeRNFBTurboApp only after native autolink.
 * Never `require('@react-native-firebase/*')` unless this is true — getEnforcing
 * reports a fatal even inside try/catch.
 */
export function isFirebaseNativeLinked(): boolean {
  try {
    return TurboModuleRegistry.get('NativeRNFBTurboApp') != null;
  } catch {
    return false;
  }
}
