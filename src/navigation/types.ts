import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: {
    email: string;
    purpose: 'register' | 'reset';
    password?: string;
    userId?: number;
  };
  ResetPassword: {
    email: string;
    code: string;
  };
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  Settings: undefined;
  Filter: undefined;
  ChangePassword: undefined;
  Privacy: undefined;
  Help: undefined;
  BlockedUsers: undefined;
  UserProfile: { userId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: {
    focus?: 'bio' | 'interests';
    interestTypeId?: number;
  };
  Settings: undefined;
  FriendsList: undefined;
  Filter: undefined;
  ChangePassword: undefined;
  Privacy: undefined;
  Help: undefined;
  BlockedUsers: undefined;
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
  Messages: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

/** Full-screen overlays above tabs (chat, notifications, …). */
export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Notifications: undefined;
  Premium: undefined;
  ChatThread: { conversationId: string };
  UserProfile: { userId: string; openTreat?: boolean };
  TreatRequest: { treatId: number };
  TreatResult: { treatId: number };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
