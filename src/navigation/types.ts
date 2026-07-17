import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: {
    email: string;
    password: string;
    userId: number;
  };
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  Settings: undefined;
  Filter: undefined;
  UserProfile: { userId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  FriendsList: undefined;
  Filter: undefined;
  UserProfile: { userId: string };
};

export type FriendsStackParamList = {
  FriendsMain: undefined;
  SearchUsers: undefined;
  UserProfile: { userId: string };
};

export type NearbyStackParamList = {
  NearbyMain: undefined;
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Nearby: NavigatorScreenParams<NearbyStackParamList>;
  Friends: NavigatorScreenParams<FriendsStackParamList>;
  Premium: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
