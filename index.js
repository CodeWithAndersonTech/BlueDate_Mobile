/**
 * @format
 */

// RN's built-in URL is incomplete (pathname/search are getters-only).
// @microsoft/signalr mutates URL during negotiate — needs a full WHATWG polyfill.
import 'react-native-url-polyfill/auto';
// Must stay early for gesture-handler / reanimated.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
