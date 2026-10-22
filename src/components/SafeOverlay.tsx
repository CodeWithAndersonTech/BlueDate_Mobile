import React from 'react';
import { Dimensions, Modal, Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

const WIN = Dimensions.get('window');

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};

/**
 * Full-screen overlay that does not present a UIViewController on iOS.
 * RN Modal + Material Top Tabs crashes iOS 26 with
 * UIViewControllerHierarchyInconsistency during appearance callbacks.
 */
export function SafeOverlay({ visible, onRequestClose, children }: Props) {
  if (!visible) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <View style={styles.fill}>{children}</View>
      </FullWindowOverlay>
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: WIN.width,
    height: WIN.height,
    backgroundColor: 'transparent',
  },
});
