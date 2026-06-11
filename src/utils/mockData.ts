import { NearbyUser } from '../components/NearbyCard';

/**
 * Static mock data for the UI/UX phase. No backend is wired up yet; screens
 * read from here so the layout, states and interactions can be reviewed. Swap
 * these for API responses in a later phase without touching the screens.
 */

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  online: boolean;
  premium?: boolean;
  lastActive?: string;
  mutualFriends?: number;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  mutualFriends: number;
  sentAt: string;
  premium?: boolean;
}

export interface PremiumPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  perMonth?: string;
  highlight?: string;
  popular?: boolean;
}

export interface PremiumPerk {
  id: string;
  icon: 'zap' | 'heart' | 'eye' | 'shield' | 'star' | 'sparkles';
  title: string;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  age: number;
  avatar?: string;
  cover?: string;
  bio: string;
  location: string;
  premium: boolean;
  verified: boolean;
  stats: {
    friends: number;
    likes: number;
    visits: number;
  };
  interests: string[];
}

const avatar = (id: number) => `https://i.pravatar.cc/300?img=${id}`;

export const currentUser: UserProfile = {
  id: 'me',
  name: 'Samet Yılmaz',
  username: '@samety',
  age: 27,
  avatar: avatar(12),
  bio: 'Oyun, kahve ve gece sürüşleri. Yeni insanlarla tanışmayı severim. 🎮☕',
  location: 'İstanbul, Türkiye',
  premium: true,
  verified: true,
  stats: { friends: 248, likes: 1820, visits: 5400 },
  interests: ['Oyun', 'Müzik', 'Seyahat', 'Fotoğraf', 'Kahve', 'Spor'],
};

export const nearbyUsers: NearbyUser[] = [
  { id: 'n1', name: 'Elif', age: 24, distanceKm: 0.4, online: true, premium: true, bio: 'Sanat & kahve tutkunu', photo: avatar(45) },
  { id: 'n2', name: 'Kerem', age: 29, distanceKm: 1.2, online: true, bio: 'Yazılımcı, gamer', photo: avatar(13) },
  { id: 'n3', name: 'Deniz', age: 26, distanceKm: 2.7, online: false, bio: 'Gezgin ruh', photo: avatar(32) },
  { id: 'n4', name: 'Ada', age: 23, distanceKm: 3.1, online: true, premium: true, bio: 'Müzik & dans', photo: avatar(47) },
  { id: 'n5', name: 'Mert', age: 31, distanceKm: 4.5, online: false, bio: 'Fotoğrafçı', photo: avatar(15) },
  { id: 'n6', name: 'Zeynep', age: 25, distanceKm: 5.8, online: true, bio: 'Yoga & doğa', photo: avatar(49) },
];

export const friends: Friend[] = [
  { id: 'f1', name: 'Ahmet Kaya', username: '@ahmetk', avatar: avatar(11), online: true, premium: true, mutualFriends: 12 },
  { id: 'f2', name: 'Selin Demir', username: '@selind', avatar: avatar(20), online: true, mutualFriends: 8 },
  { id: 'f3', name: 'Burak Şahin', username: '@buraks', avatar: avatar(33), online: false, lastActive: '2 sa önce', mutualFriends: 4 },
  { id: 'f4', name: 'Ceren Yıldız', username: '@cereny', avatar: avatar(44), online: false, lastActive: 'dün', mutualFriends: 21, premium: true },
  { id: 'f5', name: 'Emre Aydın', username: '@emrea', avatar: avatar(52), online: true, mutualFriends: 2 },
  { id: 'f6', name: 'Gizem Arslan', username: '@gizema', avatar: avatar(25), online: false, lastActive: '3 gün önce', mutualFriends: 7 },
];

export const incomingRequests: FriendRequest[] = [
  { id: 'r1', name: 'Cansu Polat', username: '@cansup', avatar: avatar(16), mutualFriends: 5, sentAt: '2 sa önce', premium: true },
  { id: 'r2', name: 'Onur Çelik', username: '@onurc', avatar: avatar(51), mutualFriends: 1, sentAt: 'dün' },
  { id: 'r3', name: 'Pınar Koç', username: '@pinark', avatar: avatar(24), mutualFriends: 9, sentAt: '2 gün önce' },
];

export const sentRequests: FriendRequest[] = [
  { id: 's1', name: 'Tolga Eren', username: '@tolgae', avatar: avatar(53), mutualFriends: 3, sentAt: '1 sa önce' },
  { id: 's2', name: 'Melis Doğan', username: '@melisd', avatar: avatar(26), mutualFriends: 0, sentAt: '4 sa önce' },
];

export const premiumPlans: PremiumPlan[] = [
  { id: 'p1', name: 'Aylık', price: '₺149', period: '/ay', highlight: 'Esnek' },
  { id: 'p2', name: '3 Aylık', price: '₺349', period: '/3ay', perMonth: '₺116/ay', popular: true, highlight: '%22 indirim' },
  { id: 'p3', name: 'Yıllık', price: '₺999', period: '/yıl', perMonth: '₺83/ay', highlight: '%44 indirim' },
];

export const premiumPerks: PremiumPerk[] = [
  { id: 'pp1', icon: 'zap', title: 'Sınırsız Eşleşme', description: 'Günlük limit olmadan beğen ve eşleş.' },
  { id: 'pp2', icon: 'eye', title: 'Seni Kimler Gördü', description: 'Profilini ziyaret edenleri gör.' },
  { id: 'pp3', icon: 'star', title: 'Öne Çıkan Profil', description: 'Yakındakilerde üst sıralarda görün.' },
  { id: 'pp4', icon: 'shield', title: 'Gizli Mod', description: 'İstediğinde profilini gizle, kontrol sende.' },
  { id: 'pp5', icon: 'heart', title: 'Süper Beğeni', description: 'Her hafta 5 süper beğeni hakkı.' },
  { id: 'pp6', icon: 'sparkles', title: 'Reklamsız Deneyim', description: 'Kesintisiz, akıcı bir kullanım.' },
];

export interface ActivityItem {
  id: string;
  type: 'like' | 'visit' | 'match' | 'request';
  name: string;
  avatar?: string;
  time: string;
}

export const recentActivity: ActivityItem[] = [
  { id: 'a1', type: 'match', name: 'Elif', avatar: avatar(45), time: 'şimdi' },
  { id: 'a2', type: 'like', name: 'Kerem', avatar: avatar(13), time: '5 dk' },
  { id: 'a3', type: 'visit', name: 'Deniz', avatar: avatar(32), time: '1 sa' },
  { id: 'a4', type: 'request', name: 'Cansu', avatar: avatar(16), time: '2 sa' },
  { id: 'a5', type: 'like', name: 'Ada', avatar: avatar(47), time: '3 sa' },
];

export const suggestedUsers = nearbyUsers.slice(0, 4);
