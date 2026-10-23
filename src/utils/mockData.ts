import { NearbyUser } from '../components/NearbyCard';

export interface Friend {
  id: string;
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

export interface PremiumPlan {
  id: string;
  nameKey: string;
  price: string;
  periodKey: string;
  perMonthKey?: string;
  highlightKey?: string;
  popular?: boolean;
  taglineKey?: string;
  perkIds: string[];
}

export interface PremiumPerk {
  id: string;
  icon: 'zap' | 'heart' | 'eye' | 'eye-off' | 'shield' | 'star' | 'sparkles';
  titleKey: string;
  descriptionKey: string;
  plusOnly?: boolean;
}

/** Live screens start empty — no preview people. */
export const nearbyUsers: NearbyUser[] = [];
export const friends: Friend[] = [];
export const incomingRequests: FriendRequest[] = [];
export const sentRequests: FriendRequest[] = [];

export const premiumPlans: PremiumPlan[] = [
  {
    id: 'standard',
    nameKey: 'premium.plan.standard.name',
    price: '₺149',
    periodKey: 'premium.plan.period',
    taglineKey: 'premium.plan.standard.tagline',
    highlightKey: 'premium.plan.standard.highlight',
    perkIds: ['visitors', 'treats', 'featured'],
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
    perkIds: ['visitors', 'treats', 'featured', 'ghost'],
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
