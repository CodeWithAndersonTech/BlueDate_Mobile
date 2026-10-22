import { InteractionManager } from 'react-native';

/**
 * Run after the current UIKit appearance transition finishes.
 * Presenting Alert/Modal or pushing a screen during a tab/stack
 * transition aborts on iOS 26 (UIViewControllerHierarchyInconsistency).
 */
export function afterUiSettled(fn: () => void, delayMs = 40): () => void {
  const task = InteractionManager.runAfterInteractions(() => {
    setTimeout(fn, delayMs);
  });
  return () => task.cancel();
}
