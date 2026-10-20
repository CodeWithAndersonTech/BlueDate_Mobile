const fs = require('fs');
const path = require('path');

const androidReady = fs.existsSync(
  path.join(__dirname, 'android/app/google-services.json'),
);
const iosReady = fs.existsSync(
  path.join(__dirname, 'ios/BlueDate/GoogleService-Info.plist'),
);

function platformsUntilConfigured() {
  const platforms = {};
  if (!androidReady) {
    platforms.android = null;
  }
  if (!iosReady) {
    platforms.ios = null;
  }
  return Object.keys(platforms).length ? { platforms } : {};
}

const firebaseLink = platformsUntilConfigured();

module.exports = {
  dependencies: {
    '@react-native-firebase/app': firebaseLink,
    '@react-native-firebase/messaging': firebaseLink,
  },
};
