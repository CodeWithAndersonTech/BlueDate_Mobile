import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '../theme';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { FriendsListScreen } from '../screens/profile/FriendsListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { FilterScreen } from '../screens/settings/FilterScreen';
import { HelpScreen } from '../screens/settings/HelpScreen';
import { PrivacyScreen } from '../screens/settings/PrivacyScreen';
import { SettingsLanguageScreen } from '../screens/settings/SettingsLanguageScreen';
import { SettingsNotificationsScreen } from '../screens/settings/SettingsNotificationsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { SettingsThemeScreen } from '../screens/settings/SettingsThemeScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';
import { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const nestedOptions = {
  gestureEnabled: true,
  // Full-screen back gesture fights Material Top Tabs pager-view and can
  // corrupt UIKit appearance transitions during tab changes.
  fullScreenGestureEnabled: false,
  animation: 'slide_from_right' as const,
};

export function ProfileStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        safeAreaInsets: { top: 0, bottom: 0 },
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="SettingsTheme"
        component={SettingsThemeScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="SettingsLanguage"
        component={SettingsLanguageScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="SettingsNotifications"
        component={SettingsNotificationsScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Filter"
        component={FilterScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={nestedOptions}
      />
    </Stack.Navigator>
  );
}

export default ProfileStack;
