import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

const WIN = Dimensions.get('window');
const UNMOUNT_MS = 160;

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};

/**
 * Full-screen overlay that does not present a UIViewController on iOS.
 * RN Modal + Material Top Tabs crashes iOS 26 with
 * UIViewControllerHierarchyInconsistency during appearance callbacks.
 * Unmount is delayed so Reanimated / gesture worklets finish first.
 */
export function SafeOverlay({ visible, onRequestClose, children }: Props) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const id = setTimeout(() => setMounted(false), UNMOUNT_MS);
    return () => clearTimeout(id);
  }, [visible]);

  if (!mounted) {
    return null;
  }

  const fill = (
    <View
      style={styles.fill}
      pointerEvents={visible ? 'auto' : 'none'}
      collapsable={false}>
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{fill}</FullWindowOverlay>;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      {fill}
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
