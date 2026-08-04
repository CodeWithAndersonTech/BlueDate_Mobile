import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import React from 'react';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { CustomTabBar } from './CustomTabBar';
import { FriendsStack } from './FriendsStack';
import { HomeStack } from './HomeStack';
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
      initialRouteName="Nearby"
      tabBarPosition="bottom"
      tabBar={renderTabBar}
      screenOptions={{
        // Nested stack screens call useLockTabSwipe() to turn this off,
        // so edge-swipe pops the stack instead of switching to Premium.
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        sceneStyle: { backgroundColor: 'transparent' },
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Friends" component={FriendsStack} />
      <Tab.Screen name="Nearby" component={NearbyStack} />
      <Tab.Screen name="Premium" component={PremiumScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default MainTabs;
