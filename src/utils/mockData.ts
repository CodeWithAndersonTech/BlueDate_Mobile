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
  /** i18n key — resolved via t() / language_translations. */
  nameKey: string;
  /** Store / billing price (not localized). */
  price: string;
  periodKey: string;
  perMonthKey?: string;
  highlightKey?: string;
  popular?: boolean;
  taglineKey?: string;
  /** Feature ids included in this plan. */
  perkIds: string[];
}

export interface PremiumPerk {
  id: string;
  icon: 'zap' | 'heart' | 'eye' | 'eye-off' | 'shield' | 'star' | 'sparkles';
  titleKey: string;
  descriptionKey: string;
  /** If true, only Premium+ includes this perk. */
  plusOnly?: boolean;
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

/** Populated later from nearby/BLE API — no mock feed. */
export const nearbyUsers: NearbyUser[] = [];

/** Populated later from friends API — no mock feed. */
export const friends: Friend[] = [];

/** Populated later from friends API — no mock feed. */
export const incomingRequests: FriendRequest[] = [];

/** Populated later from friends API — no mock feed. */
export const sentRequests: FriendRequest[] = [];

export const premiumPlans: PremiumPlan[] = [
  {
    id: 'standard',
    nameKey: 'premium.plan.standard.name',
    price: '₺149',
    periodKey: 'premium.plan.period',
    taglineKey: 'premium.plan.standard.tagline',
    highlightKey: 'premium.plan.standard.highlight',
    perkIds: ['visitors', 'treats', 'adfree', 'featured'],
  },
  {
    id: 'plus',
    nameKey: 'premium.plan.plus.name',
    price: '₺249',
    periodKey: 'premium.plan.period',
    perMonthKey: 'premium.plan.plus.per_month',
    taglineKey: 'premium.plan.plus.tagline',
    popular: true,
    highlightKey: 'premium.plan.plus.highlight',
    perkIds: ['visitors', 'treats', 'adfree', 'featured', 'ghost'],
  },
];

export const premiumPerks: PremiumPerk[] = [
  {
    id: 'visitors',
    icon: 'eye',
    titleKey: 'premium.perk.visitors.title',
    descriptionKey: 'premium.perk.visitors.desc',
  },
  {
    id: 'treats',
    icon: 'sparkles',
    titleKey: 'premium.perk.treats.title',
    descriptionKey: 'premium.perk.treats.desc',
  },
  {
    id: 'adfree',
    icon: 'zap',
    titleKey: 'premium.perk.adfree.title',
    descriptionKey: 'premium.perk.adfree.desc',
  },
  {
    id: 'featured',
    icon: 'star',
    titleKey: 'premium.perk.featured.title',
    descriptionKey: 'premium.perk.featured.desc',
  },
  {
    id: 'ghost',
    icon: 'eye-off',
    titleKey: 'premium.perk.ghost.title',
    descriptionKey: 'premium.perk.ghost.desc',
    plusOnly: true,
  },
];

export interface ActivityItem {
  id: string;
  userId: string;
  type: 'like' | 'visit' | 'match' | 'request';
  name: string;
  avatar?: string;
  time: string;
}

/** Populated later from activity API — no mock feed. */
export const recentActivity: ActivityItem[] = [];

export const suggestedUsers = nearbyUsers.slice(0, 4);

export interface ChatMessage {
  id: string;
  conversationId: string;
  /** `me` for current user, otherwise peer user id. */
  senderId: string;
  text: string;
  sentAt: string;
  /** ISO timestamp for sorting. */
  sentAtIso: string;
  read?: boolean;
}

export interface ChatConversation {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  online: boolean;
  premium?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  /** Optional short status under the name in the thread header. */
  statusKey?: 'online' | 'offline' | 'typing';
}

export const chatConversations: ChatConversation[] = [
  {
    id: 'c1',
    userId: 'u-ayse',
    name: 'Ayşe Demir',
    username: '@ayse.d',
    avatar: avatar(5),
    online: true,
    premium: true,
    lastMessage: 'Kahve önerin neydi, unuttum ☕',
    lastMessageAt: '2m',
    unreadCount: 2,
    statusKey: 'online',
  },
  {
    id: 'c2',
    userId: 'u-can',
    name: 'Can Yıldız',
    username: '@cany',
    avatar: avatar(11),
    online: true,
    lastMessage: 'Yakındayım, 10 dk’da oradayım.',
    lastMessageAt: '18m',
    unreadCount: 0,
    statusKey: 'online',
  },
  {
    id: 'c3',
    userId: 'u-elif',
    name: 'Elif Kara',
    username: '@elifk',
    avatar: avatar(9),
    online: false,
    premium: true,
    lastMessage: 'Fotoğraflar harika olmuş ✨',
    lastMessageAt: '1h',
    unreadCount: 1,
    statusKey: 'offline',
  },
  {
    id: 'c4',
    userId: 'u-mert',
    name: 'Mert Aksoy',
    username: '@mert.a',
    avatar: avatar(14),
    online: false,
    lastMessage: 'Yarın için planın var mı?',
    lastMessageAt: 'Yesterday',
    unreadCount: 0,
    statusKey: 'offline',
  },
  {
    id: 'c5',
    userId: 'u-zeynep',
    name: 'Zeynep Öztürk',
    username: '@zeynepo',
    avatar: avatar(20),
    online: true,
    lastMessage: 'Sen: Meerk’te görüşürüz 👋',
    lastMessageAt: 'Tue',
    unreadCount: 0,
    statusKey: 'typing',
  },
  {
    id: 'c6',
    userId: 'u-burak',
    name: 'Burak Şahin',
    username: '@buraks',
    avatar: avatar(33),
    online: false,
    lastMessage: 'Playlist’i paylaşır mısın?',
    lastMessageAt: 'Mon',
    unreadCount: 0,
    statusKey: 'offline',
  },
];

export const chatMessages: ChatMessage[] = [
  // Ayşe
  {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u-ayse',
    text: 'Merhaba! Nearby’de göründün, nasılsın?',
    sentAt: '14:02',
    sentAtIso: '2026-08-04T14:02:00',
    read: true,
  },
  {
    id: 'm2',
    conversationId: 'c1',
    senderId: 'me',
    text: 'İyiyim, teşekkürler 😊 Sen nasılsın?',
    sentAt: '14:05',
    sentAtIso: '2026-08-04T14:05:00',
    read: true,
  },
  {
    id: 'm3',
    conversationId: 'c1',
    senderId: 'u-ayse',
    text: 'Harika. Bugün Kadıköy’deyim, kısa bir kahve molası iyi gider.',
    sentAt: '14:08',
    sentAtIso: '2026-08-04T14:08:00',
    read: true,
  },
  {
    id: 'm4',
    conversationId: 'c1',
    senderId: 'me',
    text: 'Süper — ben de yakındayım. Favori kahven ne?',
    sentAt: '14:10',
    sentAtIso: '2026-08-04T14:10:00',
    read: true,
  },
  {
    id: 'm5',
    conversationId: 'c1',
    senderId: 'u-ayse',
    text: 'Flat white 🤍 Senin önerin neydi, unuttum ☕',
    sentAt: '14:12',
    sentAtIso: '2026-08-04T14:12:00',
    read: false,
  },
  {
    id: 'm6',
    conversationId: 'c1',
    senderId: 'u-ayse',
    text: 'Kahve önerin neydi, unuttum ☕',
    sentAt: '14:13',
    sentAtIso: '2026-08-04T14:13:00',
    read: false,
  },
  // Can
  {
    id: 'm7',
    conversationId: 'c2',
    senderId: 'me',
    text: 'Maçtan sonra bir şeyler içer miyiz?',
    sentAt: '12:40',
    sentAtIso: '2026-08-04T12:40:00',
    read: true,
  },
  {
    id: 'm8',
    conversationId: 'c2',
    senderId: 'u-can',
    text: 'Olur! Hangi taraftasın?',
    sentAt: '12:44',
    sentAtIso: '2026-08-04T12:44:00',
    read: true,
  },
  {
    id: 'm9',
    conversationId: 'c2',
    senderId: 'me',
    text: 'Moda iskelesine yakın bir yerdeyim.',
    sentAt: '12:46',
    sentAtIso: '2026-08-04T12:46:00',
    read: true,
  },
  {
    id: 'm10',
    conversationId: 'c2',
    senderId: 'u-can',
    text: 'Yakındayım, 10 dk’da oradayım.',
    sentAt: '12:50',
    sentAtIso: '2026-08-04T12:50:00',
    read: true,
  },
  // Elif
  {
    id: 'm11',
    conversationId: 'c3',
    senderId: 'u-elif',
    text: 'Profilindeki seyahat fotoğraflarına bayıldım.',
    sentAt: 'Yesterday',
    sentAtIso: '2026-08-03T19:20:00',
    read: true,
  },
  {
    id: 'm12',
    conversationId: 'c3',
    senderId: 'me',
    text: 'Teşekkürler! Lizbon’tan. Senin favori şehrin?',
    sentAt: 'Yesterday',
    sentAtIso: '2026-08-03T19:25:00',
    read: true,
  },
  {
    id: 'm13',
    conversationId: 'c3',
    senderId: 'u-elif',
    text: 'Fotoğraflar harika olmuş ✨',
    sentAt: '11:02',
    sentAtIso: '2026-08-04T11:02:00',
    read: false,
  },
  // Mert
  {
    id: 'm14',
    conversationId: 'c4',
    senderId: 'u-mert',
    text: 'Dünkü etkinlik epey kalabalıktı.',
    sentAt: 'Yesterday',
    sentAtIso: '2026-08-03T21:10:00',
    read: true,
  },
  {
    id: 'm15',
    conversationId: 'c4',
    senderId: 'me',
    text: 'Evet, müzik de iyiydi.',
    sentAt: 'Yesterday',
    sentAtIso: '2026-08-03T21:14:00',
    read: true,
  },
  {
    id: 'm16',
    conversationId: 'c4',
    senderId: 'u-mert',
    text: 'Yarın için planın var mı?',
    sentAt: 'Yesterday',
    sentAtIso: '2026-08-03T21:18:00',
    read: true,
  },
  // Zeynep
  {
    id: 'm17',
    conversationId: 'c5',
    senderId: 'u-zeynep',
    text: 'Meerk Premium denedin mi?',
    sentAt: 'Tue',
    sentAtIso: '2026-08-02T16:00:00',
    read: true,
  },
  {
    id: 'm18',
    conversationId: 'c5',
    senderId: 'me',
    text: 'Evet, Ghost Mode fena değil 😄',
    sentAt: 'Tue',
    sentAtIso: '2026-08-02T16:05:00',
    read: true,
  },
  {
    id: 'm19',
    conversationId: 'c5',
    senderId: 'me',
    text: 'Meerk’te görüşürüz 👋',
    sentAt: 'Tue',
    sentAtIso: '2026-08-02T16:06:00',
    read: true,
  },
  // Burak
  {
    id: 'm20',
    conversationId: 'c6',
    senderId: 'u-burak',
    text: 'Araba sürüşü playlist’in var mı?',
    sentAt: 'Mon',
    sentAtIso: '2026-08-01T20:30:00',
    read: true,
  },
  {
    id: 'm21',
    conversationId: 'c6',
    senderId: 'me',
    text: 'Var, gece sürüşü için lo-fi + indie mix.',
    sentAt: 'Mon',
    sentAtIso: '2026-08-01T20:40:00',
    read: true,
  },
  {
    id: 'm22',
    conversationId: 'c6',
    senderId: 'u-burak',
    text: 'Playlist’i paylaşır mısın?',
    sentAt: 'Mon',
    sentAtIso: '2026-08-01T20:42:00',
    read: true,
  },
];

export function getConversationById(id: string): ChatConversation | undefined {
  return chatConversations.find(c => c.id === id);
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  return chatMessages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.sentAtIso.localeCompare(b.sentAtIso));
}

export type AppNotificationType =
  | 'like'
  | 'match'
  | 'visit'
  | 'friend_request'
  | 'friend_accept'
  | 'message';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  userId: string;
  name: string;
  avatar?: string;
  premium?: boolean;
  /** Relative time label for the list (mock). */
  createdAt: string;
  unread: boolean;
  /** Optional deep-link into a chat thread. */
  conversationId?: string;
}

export const appNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'like',
    userId: 'u-ayse',
    name: 'Ayşe Demir',
    avatar: avatar(5),
    premium: true,
    createdAt: '2m',
    unread: true,
  },
  {
    id: 'n2',
    type: 'message',
    userId: 'u-can',
    name: 'Can Yıldız',
    avatar: avatar(11),
    createdAt: '18m',
    unread: true,
    conversationId: 'c2',
  },
  {
    id: 'n3',
    type: 'friend_request',
    userId: 'u-elif',
    name: 'Elif Kara',
    avatar: avatar(9),
    premium: true,
    createdAt: '41m',
    unread: true,
  },
  {
    id: 'n4',
    type: 'match',
    userId: 'u-zeynep',
    name: 'Zeynep Öztürk',
    avatar: avatar(20),
    createdAt: '1h',
    unread: true,
    conversationId: 'c5',
  },
  {
    id: 'n5',
    type: 'visit',
    userId: 'u-mert',
    name: 'Mert Aksoy',
    avatar: avatar(14),
    createdAt: '3h',
    unread: false,
  },
  {
    id: 'n6',
    type: 'friend_accept',
    userId: 'u-burak',
    name: 'Burak Şahin',
    avatar: avatar(33),
    createdAt: 'Yesterday',
    unread: false,
  },
  {
    id: 'n7',
    type: 'like',
    userId: 'u-deniz',
    name: 'Deniz Aydın',
    avatar: avatar(28),
    createdAt: 'Yesterday',
    unread: false,
  },
  {
    id: 'n8',
    type: 'visit',
    userId: 'u-selin',
    name: 'Selin Koç',
    avatar: avatar(47),
    premium: true,
    createdAt: 'Tue',
    unread: false,
  },
  {
    id: 'n9',
    type: 'message',
    userId: 'u-ayse',
    name: 'Ayşe Demir',
    avatar: avatar(5),
    premium: true,
    createdAt: 'Tue',
    unread: false,
    conversationId: 'c1',
  },
];

export type PublicInterestKey =
  | 'food'
  | 'dessert'
  | 'coffee'
  | 'beverage';

export type PublicInterest = {
  key: PublicInterestKey;
  label: string;
  value: string;
};

/** Unified public profile used when opening another user's page from lists. */
export interface PublicUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  online?: boolean;
  bio: string;
  age?: number;
  distanceKm?: number;
  mutualFriends?: number;
  interests: PublicInterest[];
}

const INTEREST_PROFILES: Record<string, PublicInterest[]> = {
  n1: [
    { key: 'food', label: 'Food', value: 'Ev yapımı makarna ve deniz ürünleri' },
    { key: 'dessert', label: 'Dessert', value: 'Cheesecake ve dondurma' },
    { key: 'coffee', label: 'Coffee', value: 'Flat white, orta sertlik' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · limonata',
    },
  ],
  n2: [
    { key: 'food', label: 'Food', value: 'Burger ve Asya mutfağı' },
    { key: 'dessert', label: 'Dessert', value: 'Çikolatalı brownie' },
    { key: 'coffee', label: 'Coffee', value: 'Espresso / Americano' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · craft bira',
    },
  ],
  n3: [
    { key: 'food', label: 'Food', value: 'Sokak lezzetleri, kebap' },
    { key: 'dessert', label: 'Dessert', value: 'Baklava' },
    { key: 'coffee', label: 'Coffee', value: 'Türk kahvesi' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · ayran',
    },
  ],
  n4: [
    { key: 'food', label: 'Food', value: 'Vegan bowl ve salata' },
    { key: 'dessert', label: 'Dessert', value: 'Meyveli tart' },
    { key: 'coffee', label: 'Coffee', value: 'Latte, badem sütü' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · matcha',
    },
  ],
  n5: [
    { key: 'food', label: 'Food', value: 'Steak ve ızgara' },
    { key: 'dessert', label: 'Dessert', value: 'Tiramisu' },
    { key: 'coffee', label: 'Coffee', value: 'Cold brew' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · kırmızı şarap',
    },
  ],
  n6: [
    { key: 'food', label: 'Food', value: 'Akdeniz mutfağı' },
    { key: 'dessert', label: 'Dessert', value: 'Yoğurtlu tatlı' },
    { key: 'coffee', label: 'Coffee', value: 'Filter coffee' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · bitki çayı',
    },
  ],
  f1: [
    { key: 'food', label: 'Food', value: 'Pizza ve İtalyan mutfağı' },
    { key: 'dessert', label: 'Dessert', value: 'Profiterol' },
    { key: 'coffee', label: 'Coffee', value: 'Cappuccino' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · bira',
    },
  ],
  f2: [
    { key: 'food', label: 'Food', value: 'Sushi' },
    { key: 'dessert', label: 'Dessert', value: 'Mochi' },
    { key: 'coffee', label: 'Coffee', value: 'Matcha latte' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · soda',
    },
  ],
  f3: [
    { key: 'food', label: 'Food', value: 'Köfte / mangal' },
    { key: 'dessert', label: 'Dessert', value: 'Sütlaç' },
    { key: 'coffee', label: 'Coffee', value: 'Türk kahvesi' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · şalgam',
    },
  ],
  f4: [
    { key: 'food', label: 'Food', value: 'Brunch ve avokadolu tost' },
    { key: 'dessert', label: 'Dessert', value: 'Pancake' },
    { key: 'coffee', label: 'Coffee', value: 'Cortado' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · prosecco',
    },
  ],
  f5: [
    { key: 'food', label: 'Food', value: 'Fast-casual bowls' },
    { key: 'dessert', label: 'Dessert', value: 'Cookie dough' },
    { key: 'coffee', label: 'Coffee', value: 'Iced latte' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · energy drink',
    },
  ],
  f6: [
    { key: 'food', label: 'Food', value: 'Ev yemekleri' },
    { key: 'dessert', label: 'Dessert', value: 'Kurabiye' },
    { key: 'coffee', label: 'Coffee', value: 'Filtre kahve' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · limonata',
    },
  ],
  r1: [
    { key: 'food', label: 'Food', value: 'Deniz ürünleri' },
    { key: 'dessert', label: 'Dessert', value: 'Magnolia' },
    { key: 'coffee', label: 'Coffee', value: 'Latte' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · kokteyl',
    },
  ],
  r2: [
    { key: 'food', label: 'Food', value: 'Dürüm / wrap' },
    { key: 'dessert', label: 'Dessert', value: 'Waffle' },
    { key: 'coffee', label: 'Coffee', value: 'Espresso' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · cola',
    },
  ],
  r3: [
    { key: 'food', label: 'Food', value: 'Meze ve zeytinyağlılar' },
    { key: 'dessert', label: 'Dessert', value: 'Kazandibi' },
    { key: 'coffee', label: 'Coffee', value: 'Türk kahvesi' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · şerbet',
    },
  ],
  s1: [
    { key: 'food', label: 'Food', value: 'Ramen' },
    { key: 'dessert', label: 'Dessert', value: 'Matcha cake' },
    { key: 'coffee', label: 'Coffee', value: 'Black coffee' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · sake',
    },
  ],
  s2: [
    { key: 'food', label: 'Food', value: 'Pasta ve salata' },
    { key: 'dessert', label: 'Dessert', value: 'Fruit salad' },
    { key: 'coffee', label: 'Coffee', value: 'Cappuccino' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · sparkling water',
    },
  ],
};

const DEFAULT_INTERESTS: PublicInterest[] = [
  { key: 'food', label: 'Food', value: 'Henüz paylaşılmadı' },
  { key: 'dessert', label: 'Dessert', value: 'Henüz paylaşılmadı' },
  { key: 'coffee', label: 'Coffee', value: 'Henüz paylaşılmadı' },
  {
    key: 'beverage',
    label: 'Alcoholic or non-alcoholic beverage',
    value: 'Henüz paylaşılmadı',
  },
];

const DEFAULT_BIOS: Record<string, string> = {
  f1: 'Futbol, kahve ve iyi sohbet. Hafta sonları sahilde yürüyüş.',
  f2: 'Tasarım, müzik ve yeni kafeler keşfetmeyi severim.',
  f3: 'Spor salonu + dizi maratonu. Sade ve net biriyim.',
  f4: 'Fotoğraf, seyahat ve akşam yürüyüşleri.',
  f5: 'Kod yazıp ara sıra sörf hayali kuruyorum.',
  f6: 'Kitap, yoga ve sakin kahvaltılar.',
  r1: 'Yeni insanlarla tanışmayı ve şehir keşfini severim.',
  r2: 'Gamer, sinema ve gece kahvesi.',
  r3: 'Doğa, kamp ve akustik müzik.',
  s1: 'Asya mutfağı ve teknoloji meraklısı.',
  s2: 'Koşu, podcast ve brunch.',
};

function buildPublicUser(base: {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  online?: boolean;
  bio?: string;
  age?: number;
  distanceKm?: number;
  mutualFriends?: number;
}): PublicUser {
  return {
    id: base.id,
    name: base.name,
    username: base.username,
    avatar: base.avatar,
    online: base.online,
    bio: base.bio ?? DEFAULT_BIOS[base.id] ?? 'Henüz bir biyografi eklenmemiş.',
    age: base.age,
    distanceKm: base.distanceKm,
    mutualFriends: base.mutualFriends,
    interests: INTEREST_PROFILES[base.id] ?? DEFAULT_INTERESTS,
  };
}

export function findPublicUser(userId: string): PublicUser | undefined {
  const friend = friends.find(f => f.id === userId);
  if (friend) {
    return buildPublicUser({
      id: friend.id,
      name: friend.name,
      username: friend.username,
      avatar: friend.avatar,
      online: friend.online,
      mutualFriends: friend.mutualFriends,
    });
  }

  const nearby = nearbyUsers.find(n => n.id === userId);
  if (nearby) {
    return buildPublicUser({
      id: nearby.id,
      name: nearby.name,
      username: `@${nearby.name.toLowerCase()}`,
      avatar: nearby.photo,
      online: nearby.online,
      bio: nearby.bio,
      age: nearby.age,
      distanceKm: nearby.distanceKm,
    });
  }

  const incoming = incomingRequests.find(r => r.id === userId);
  if (incoming) {
    return buildPublicUser({
      id: incoming.id,
      name: incoming.name,
      username: incoming.username,
      avatar: incoming.avatar,
      mutualFriends: incoming.mutualFriends,
    });
  }

  const sent = sentRequests.find(r => r.id === userId);
  if (sent) {
    return buildPublicUser({
      id: sent.id,
      name: sent.name,
      username: sent.username,
      avatar: sent.avatar,
      mutualFriends: sent.mutualFriends,
    });
  }

  return undefined;
}
