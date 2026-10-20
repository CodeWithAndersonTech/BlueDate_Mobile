import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Live keyboard height; 0 when hidden. Use to sit a bottom sheet flush on the keys. */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(show, event => {
      setHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hide, () => {
      setHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return height;
}
