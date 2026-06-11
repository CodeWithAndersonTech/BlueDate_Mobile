import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React from 'react';
import { NearbyScreen } from '../screens/nearby/NearbyScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { CustomTabBar } from './CustomTabBar';
import { FriendsStack } from './FriendsStack';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * React Navigation invokes `tabBar` as a render function (`tabBar(props)`), not
 * as `<TabBar />`. Returning JSX here lets React mount CustomTabBar properly so
 * hooks inside it (useTheme, reanimated, etc.) are valid.
 */
function renderTabBar(props: BottomTabBarProps) {
  return <CustomTabBar {...props} />;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Nearby" component={NearbyScreen} />
      <Tab.Screen name="Friends" component={FriendsStack} />
      <Tab.Screen name="Premium" component={PremiumScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default MainTabs;
