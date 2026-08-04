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
