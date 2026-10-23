import { Alert } from 'react-native';
import { afterUiSettled } from './afterUiSettled';

const nativeAlert = Alert.alert.bind(Alert);

/**
 * iOS 26 + Material Top Tabs: presenting Alert during a tab/sheet
 * appearance callback kills the process. Defer every Alert.alert.
 */
export function installSafeAlert() {
  Alert.alert = ((title, message, buttons, options) => {
    afterUiSettled(() => {
      try {
        nativeAlert(title, message, buttons, options);
      } catch (error) {
        console.warn('[safeAlert] suppressed', error);
      }
    }, 80);
  }) as typeof Alert.alert;
}
