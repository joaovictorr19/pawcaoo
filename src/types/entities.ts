/**
 * Core entity type definitions for the PawCao platform.
 * These types represent the Base44 entity schemas used across the app.
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  role: 'user' | 'admin';
  account_type: 'owner' | 'walker' | 'trainer' | 'both' | 'company';
  profile_photo_url?: string;
  cover_photo_url?: string;
  bio?: string;
  city?: string;
  phone?: string;
  is_verified?: boolean;
  is_suspended?: boolean;
  is_banned?: boolean;
  gamification_xp?: number;
  gamification_level?: number;
  achievements_badges?: Badge[];
  profile_stats?: ProfileStats;
  pawgo_status?: PawGoStatus;
  preferences?: UserPreferences;
  professional_profile?: ProfessionalProfile;
  wallet?: WalletSummary;
  referral_code?: string;
  push_subscription?: string;
  company_type?: string;
  followers_count?: number;
  following_count?: number;
  total_posts?: number;
  isImpersonating?: boolean;
}

export interface PawGoStatus {
  is_online: boolean;
  last_active?: string;
}

export interface UserPreferences {
  current_mode: 'owner' | 'professional';
  language?: string;
  notifications_enabled?: boolean;
}

export interface ProfessionalProfile {
  verification_status: 'pending' | 'verified' | 'rejected';
  is_trained: boolean;
  category: string;
}

export interface WalletSummary {
  free_walks: number;
  balance: number;
  currency: string;
}

export interface ProfileStats {
  total_posts: number;
  total_likes_received: number;
  total_comments_made: number;
  total_bookings: number;
  total_dogs_helped: number;
  total_referrals: number;
  total_reviews_written: number;
  total_forum_topics: number;
  total_forum_replies: number;
  total_events_attended: number;
  total_adoptions: number;
  member_since_days: number;
}

export interface Badge {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_date: string;
  category: string;
  xp_reward: number;
}

export interface WalkerProfile {
  id: string;
  created_by: string;
  walker_name: string;
  photo_url?: string;
  cover_photo_url?: string;
  bio?: string;
  location?: string;
  rating: number;
  total_walks: number;
  experience_years: number;
  hourly_rate: number;
  dog_sizes: string[];
  dog_breeds_handled: string[];
  breed_specialization: string[];
  specializations: string[];
  availability: string[];
  service_areas: string[];
  can_walk_multiple_dogs: boolean;
  is_active: boolean;
  is_online: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  stripe_account_id?: string;
  stripe_payouts_enabled?: boolean;
  services_offered?: string[];
}

export interface TrainerProfile {
  id: string;
  created_by: string;
  trainer_name: string;
  photo_url?: string;
  cover_photo_url?: string;
  bio?: string;
  location?: string;
  rating: number;
  experience_years: number;
  hourly_rate: number;
  specializations: string[];
  is_active: boolean;
  is_online: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface Booking {
  id: string;
  owner_email: string;
  owner_name: string;
  walker_email: string;
  walker_name: string;
  dog_name: string;
  walk_date: string;
  walk_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'service_completed';
  payment_status: 'pending' | 'paid' | 'released' | 'refunded';
  payment_id?: string;
  completion_code?: string;
  pickup_token?: string;
  dropoff_token?: string;
  tokens_expire_at?: string;
  token_version?: number;
  completed_date?: string;
  created_date: string;
}

export interface Notification {
  id: string;
  recipient_email: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'message' | 'emergency' | 'adoption' | 'system' | 'booking_reminder' | 'review_reminder' | 'token_expiry_warning';
  related_id?: string;
  priority: 'normal' | 'high' | 'urgent';
  action_url?: string;
  is_read: boolean;
  created_date: string;
}

export interface UserWallet {
  id: string;
  user_email: string;
  service_tokens: number;
  tokens_used_this_month: number;
  tokens_expiry_date?: string;
  escrow_balance: number;
  total_points: number;
  pending_walker_payments: number;
}

export interface WalkerPayout {
  id: string;
  walker_email: string;
  walker_name: string;
  client_email: string;
  booking_id: string;
  net_amount: number;
  payout_type: 'direct' | 'token_redemption';
  status: 'pending' | 'completed' | 'failed' | 'blocked' | 'pending_stripe_setup' | 'escalated';
  blocked_reason?: string;
  stripe_transfer_id?: string;
  paid_at?: string;
  notes?: string;
  created_date: string;
}

export interface OwnerSubscription {
  id: string;
  owner_email: string;
  plan_type: 'free' | 'basic' | 'premium' | 'vip';
  is_active: boolean;
  free_walks_per_month: number;
  free_walks_used_this_month: number;
  points_multiplier: number;
  created_date: string;
}

export interface DogProfile {
  id: string;
  owner_email: string;
  dog_name: string;
  breed: string;
  size: 'small' | 'medium' | 'large' | 'giant';
  age: number;
  energy_level: 'low' | 'normal' | 'high';
  socialization: 'shy' | 'friendly' | 'aggressive';
  behavioral_notes?: string;
  special_needs?: boolean;
  gets_along_with?: Record<string, boolean>;
}
