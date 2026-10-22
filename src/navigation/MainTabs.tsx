import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import React from 'react';
import { CustomTabBar } from './CustomTabBar';
import { FriendsStack } from './FriendsStack';
import { HomeStack } from './HomeStack';
import { MessagesStack } from './MessagesStack';
import { NearbyStack } from './NearbyStack';
import { ProfileStack } from './ProfileStack';
import { MainTabParamList } from './types';

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

function renderTabBar(props: MaterialTopTabBarProps) {
  return <CustomTabBar {...props} />;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBarPosition="bottom"
      tabBar={renderTabBar}
      screenOptions={{
        // Nested stack screens call useLockTabSwipe() to turn this off.
        // iOS New Arch + Material Top Tabs: swipe/lazy remounts abort with
        // UIViewControllerHierarchyInconsistency (appearance callbacks).
        // Tap the tab bar to switch; keep scenes mounted.
        swipeEnabled: false,
        animationEnabled: false,
        lazy: false,
        sceneStyle: { flex: 1 },
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Friends" component={FriendsStack} />
      <Tab.Screen name="Nearby" component={NearbyStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default MainTabs;
