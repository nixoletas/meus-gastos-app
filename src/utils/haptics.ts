import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Wrappers de vibração tátil. No web os haptics não existem,
 * então viram no-op silenciosamente.
 */

export function tapLight() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapMedium() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function notifySuccess() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}

export function notifyWarning() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {}
  );
}
