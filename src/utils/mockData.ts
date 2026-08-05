import { NearbyUser } from '../components/NearbyCard';

/**
 * Static mock data for the UI/UX phase. No backend is wired up yet; screens
 * read from here so the layout, states and interactions can be reviewed. Swap
 * these for API responses in a later phase without touching the screens.
 */

export interface Friend {
  id: string;
  /** Stable numeric id used for UserProfile navigation (900000+ = mock). */
  userId: number;
  name: string;
  username: string;
  avatar?: string;
  online: boolean;
  premium?: boolean;
  lastActive?: string;
  mutualFriends?: number;
  bio?: string;
  age?: number;
}

export interface FriendRequest {
  id: string;
  /** Stable numeric id used for UserProfile navigation (900000+ = mock). */
  userId: number;
  name: string;
  username: string;
  avatar?: string;
  mutualFriends: number;
  sentAt: string;
  premium?: boolean;
  bio?: string;
  age?: number;
}

/** Mock profile user ids live in this range so they never hit the real API. */
export const MOCK_PROFILE_ID_MIN = 900000;

export function isMockProfileUserId(userId: number): boolean {
  return Number.isFinite(userId) && userId >= MOCK_PROFILE_ID_MIN;
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

/** UI preview rows when Friends API is empty. */
export const friends: Friend[] = [
  {
    id: 'mock-friend-1',
    userId: 900003,
    name: 'Zeynep Kara',
    username: '@zeynepk',
    avatar: avatar(47),
    online: true,
    premium: true,
    mutualFriends: 5,
    lastActive: 'now',
    age: 24,
    bio: 'Kitap, yoga ve sakin kahvaltılar. Hafta içi akşam yürüyüşüne açığım.',
  },
];

/** UI preview rows when Incoming API is empty. */
export const incomingRequests: FriendRequest[] = [
  {
    id: 'mock-incoming-1',
    userId: 900001,
    name: 'Elif Demir',
    username: '@elifd',
    avatar: avatar(32),
    mutualFriends: 3,
    sentAt: '2h',
    premium: true,
    age: 26,
    bio: 'Tasarım, kahve ve akşam yürüyüşleri. Yeni yerler keşfetmeyi severim.',
  },
];

/** UI preview rows when Sent API is empty. */
export const sentRequests: FriendRequest[] = [
  {
    id: 'mock-sent-1',
    userId: 900002,
    name: 'Can Yıldız',
    username: '@cany',
    avatar: avatar(15),
    mutualFriends: 1,
    sentAt: '1d',
    age: 28,
    bio: 'Spor, sinema ve iyi playlistler. Hafta sonu planına açığım.',
  },
];

export type MockUserProfile = {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  profileImage?: string;
  isVerified: boolean;
  age?: number;
  mutualFriends: number;
  /** 1 = PendingOutgoing, 2 = PendingIncoming, 3 = Friends. */
  relation: 1 | 2 | 3;
  friendshipId: number;
  interests: Array<{
    id: number;
    value: string;
    code: string;
    name: string;
  }>;
  photoUris: string[];
  likeCount: number;
};

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

// Chat types + dummy conversations removed — live data via src/api/chat.ts / ChatContext.

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
  'mock-incoming-1': [
    { key: 'food', label: 'Food', value: 'Avokadolu tost & brunch' },
    { key: 'dessert', label: 'Dessert', value: 'Cheesecake' },
    { key: 'coffee', label: 'Coffee', value: 'Flat white' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · limonata',
    },
  ],
  'mock-sent-1': [
    { key: 'food', label: 'Food', value: 'Burger & ızgara' },
    { key: 'dessert', label: 'Dessert', value: 'Brownie' },
    { key: 'coffee', label: 'Coffee', value: 'Americano' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Alcoholic · craft bira',
    },
  ],
  'mock-friend-1': [
    { key: 'food', label: 'Food', value: 'Akdeniz mutfağı' },
    { key: 'dessert', label: 'Dessert', value: 'Yoğurtlu tatlı' },
    { key: 'coffee', label: 'Coffee', value: 'Filter coffee' },
    {
      key: 'beverage',
      label: 'Alcoholic or non-alcoholic beverage',
      value: 'Non-alcoholic · bitki çayı',
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
  'mock-incoming-1':
    'Tasarım, kahve ve akşam yürüyüşleri. Yeni yerler keşfetmeyi severim.',
  'mock-sent-1':
    'Spor, sinema ve iyi playlistler. Hafta sonu planına açığım.',
  'mock-friend-1':
    'Kitap, yoga ve sakin kahvaltılar. Hafta içi akşam yürüyüşüne açığım.',
};

function personToMockProfile(
  person: {
    id: string;
    userId: number;
    name: string;
    username: string;
    avatar?: string;
    premium?: boolean;
    bio?: string;
    age?: number;
    mutualFriends?: number;
  },
  relation: 1 | 2 | 3,
  friendshipId: number,
): MockUserProfile {
  const parts = person.name.trim().split(/\s+/);
  const firstName = parts[0] ?? person.name;
  const lastName = parts.slice(1).join(' ');
  const interestSeed = INTEREST_PROFILES[person.id] ?? DEFAULT_INTERESTS;

  return {
    userId: person.userId,
    firstName,
    lastName,
    username: person.username.replace(/^@/, ''),
    bio:
      person.bio ??
      DEFAULT_BIOS[person.id] ??
      'Henüz bir biyografi eklenmemiş.',
    profileImage: person.avatar,
    isVerified: Boolean(person.premium),
    age: person.age,
    mutualFriends: person.mutualFriends ?? 0,
    relation,
    friendshipId,
    interests: interestSeed.map((item, index) => ({
      id: person.userId * 10 + index,
      value: item.value,
      code: item.key,
      name: item.label,
    })),
    photoUris: [
      person.avatar ?? avatar(20),
      avatar((person.userId % 70) + 1),
      avatar(((person.userId + 8) % 70) + 1),
    ],
    likeCount: relation === 3 ? 64 : relation === 2 ? 42 : 18,
  };
}

const MOCK_PROFILES: Record<number, MockUserProfile> = {
  ...Object.fromEntries(
    friends.map((f, i) => [
      f.userId,
      personToMockProfile(f, 3, -(3000 + i)),
    ]),
  ),
  ...Object.fromEntries(
    incomingRequests.map((r, i) => [
      r.userId,
      personToMockProfile(r, 2, -(1000 + i)),
    ]),
  ),
  ...Object.fromEntries(
    sentRequests.map((r, i) => [
      r.userId,
      personToMockProfile(r, 1, -(2000 + i)),
    ]),
  ),
};

export function getMockUserProfile(
  userId: number,
): MockUserProfile | undefined {
  return MOCK_PROFILES[userId];
}

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
  const numericId = Number(userId);
  const friend = friends.find(
    f => f.id === userId || f.userId === numericId,
  );
  if (friend) {
    return buildPublicUser({
      id: friend.id,
      name: friend.name,
      username: friend.username,
      avatar: friend.avatar,
      online: friend.online,
      bio: friend.bio,
      age: friend.age,
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

  const incoming = incomingRequests.find(
    r => r.id === userId || r.userId === numericId,
  );
  if (incoming) {
    return buildPublicUser({
      id: incoming.id,
      name: incoming.name,
      username: incoming.username,
      avatar: incoming.avatar,
      bio: incoming.bio,
      age: incoming.age,
      mutualFriends: incoming.mutualFriends,
    });
  }

  const sent = sentRequests.find(
    r => r.id === userId || r.userId === numericId,
  );
  if (sent) {
    return buildPublicUser({
      id: sent.id,
      name: sent.name,
      username: sent.username,
      avatar: sent.avatar,
      bio: sent.bio,
      age: sent.age,
      mutualFriends: sent.mutualFriends,
    });
  }

  return undefined;
}
