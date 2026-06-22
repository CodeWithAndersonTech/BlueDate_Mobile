import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  Settings: undefined;
  Filter: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  FriendsList: undefined;
  Filter: undefined;
};

export type FriendsStackParamList = {
  FriendsMain: undefined;
  SearchUsers: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Nearby: undefined;
  Friends: NavigatorScreenParams<FriendsStackParamList>;
  Premium: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
