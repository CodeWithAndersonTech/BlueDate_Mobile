module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // react-native-worklets/plugin must be listed last (it powers Reanimated 4).
    'react-native-worklets/plugin',
  ],
};
