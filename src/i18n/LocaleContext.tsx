import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  bindDeviceUser,
  bootstrapDevice,
  fetchLanguages,
  fetchTranslationsByCode,
  LanguageDto,
  updateDeviceLanguage,
} from '../api';
import { setApiLanguageCode } from '../api/languageHeader';
import { getDeviceLaunchInfo } from '../utils/deviceInfo';

type LocaleStatus = 'loading' | 'ready' | 'error';

type DeviceState = {
  id: number | null;
  uniqueId: string;
  languageCode: string;
  cultureCode: string | null;
  theme: string;
  userId: number | null;
  isNew: boolean;
};

interface LocaleContextValue {
  status: LocaleStatus;
  error: string | null;
  languageCode: string;
  languages: LanguageDto[];
  translations: Record<string, string>;
  device: DeviceState | null;
  t: (key: string, fallback?: string) => string;
  setLanguage: (code: string) => Promise<void>;
  bindUser: (userId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const FALLBACK_LANGUAGES: LanguageDto[] = [
  {
    Id: 1,
    Name: 'Türkçe',
    Code: 'tr',
    CultureCode: 'tr-TR',
    IsDefault: 0,
    IsActive: 1,
  },
  {
    Id: 2,
    Name: 'English',
    Code: 'en',
    CultureCode: 'en-US',
    IsDefault: 1,
    IsActive: 1,
  },
];

const FALLBACK_TRANSLATIONS: Record<string, string> = {
  'splash.brand': 'Meerk',
  'splash.tagline': 'New connections start here',
  'auth.login_title': 'Welcome back',
  'auth.login_subtitle': 'Sign in to continue',
  'auth.email_or_phone': 'Email or phone',
  'auth.password': 'Password',
  'auth.forgot_password': 'Forgot password',
  'auth.forgot_title': 'Reset password',
  'auth.forgot_subtitle':
    'Enter your account email and we will send you a link to reset your password.',
  'auth.forgot_send': 'Send reset link',
  'auth.forgot_back': 'Back to login',
  'auth.forgot_resend': 'Resend link',
  'auth.forgot_sent_title': 'Check your email',
  'auth.forgot_sent_desc': 'We sent a password reset link to',
  'auth.login': 'Log In',
  'auth.or_continue': 'or continue with',
  'auth.no_account': "Don't have an account?",
  'auth.register': 'Sign Up',
  'auth.register_title': 'Create account',
  'auth.register_subtitle': 'Join the community, meet new people.',
  'auth.first_name': 'First name',
  'auth.last_name': 'Last name',
  'auth.email': 'Email',
  'auth.confirm_password': 'Confirm password',
  'auth.password_hint': 'At least 8 characters',
  'auth.confirm_password_hint': 'Re-enter your password',
  'auth.terms_prefix': 'By continuing you accept the',
  'auth.terms_of_use': 'Terms of Use',
  'auth.and': 'and',
  'auth.privacy_policy': 'Privacy Policy',
  'auth.terms_suffix': '.',
  'auth.already_have_account': 'Already have an account?',
  'auth.language': 'Language',
  'auth.password_mismatch': 'Passwords do not match',
  'auth.password_min': 'Password must be at least 8 characters',
  'auth.confirm_required': 'Please confirm your password',
  'auth.first_name_placeholder': 'Your first name',
  'auth.last_name_placeholder': 'Your last name',
  'auth.email_placeholder': 'name@mail.com',
  'auth.username': 'Username',
  'auth.username_placeholder': 'username',
  'auth.username_taken': 'This username is already taken',
  'auth.username_required': 'Username is required',
  'auth.username_length': 'Username must be between 3 and 50 characters',
  'auth.email_invalid': 'Enter a valid email address',
  'auth.email_required': 'Email is required',
  'auth.email_exists': 'This email is already registered',
  'auth.invalid_credentials': 'Invalid email or password',
  'auth.login_success': 'Login successful',
  'auth.register_success': 'User created successfully',
  'auth.identifier_invalid': 'Enter a valid email or phone number',
  'auth.verify_title': 'Verify email',
  'auth.verify_heading': 'Enter verification code',
  'auth.verify_subtitle': 'We sent a 6-digit code to',
  'auth.verify_action': 'Verify',
  'auth.verify_resend': 'Resend code',
  'auth.verify_resend_in': 'Resend code in',
  'auth.verify_invalid_code': 'Invalid code. Try 111111 for now.',
  'auth.gender': 'Gender',
  'auth.gender_required': 'Please select a gender',
  'auth.age': 'Age',
  'auth.age_unit': 'years old',
  'auth.age_hint': 'Swipe or tap to choose. Minimum age is 18.',
  'auth.age_required': 'Please select your age',
  'auth.age_invalid': 'Enter a valid age between 18 and 100',
  'auth.age_too_young': 'You must be at least 18 years old',
  'auth.birth_date_required': 'Birth date is required',
  'auth.birth_date_invalid': 'Please enter a valid birth date',
  'gender.men': 'Men',
  'gender.woman': 'Woman',
  'gender.other': 'Other',
  'common.google': 'Google',
  'common.phone': 'Phone',
  'common.apple': 'Apple',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.error_generic': 'Something went wrong.',
  // Profile
  'profile.edit': 'Edit Profile',
  'profile.edit_action': 'Edit',
  'profile.add_bio': 'Add bio',
  'profile.add_bio_desc':
    'Introduce yourself briefly to make your profile stand out.',
  'profile.stat_friends': 'Friends',
  'profile.stat_likes': 'Likes',
  'profile.stat_visits': 'Visits',
  'profile.interests': 'Interests',
  'profile.add_interests': 'Add interests',
  'profile.categories_ready': 'categories ready. Note your favorites.',
  'profile.interests_empty': 'Complete your profile by adding your favorites.',
  'profile.not_verified': 'Not verified',
  'profile.verified_badge': 'Verified account',
  'profile.verify_requires_interests':
    'Fill every interest and add at least one photo to get a verified badge.',
  'profile.photos': 'Photos',
  'profile.photos_empty': 'Add your first photo',
  'profile.add_photo': 'Add photo',
  'profile.change_avatar': 'Change profile photo',
  'profile.delete_photo': 'Delete',
  'profile.delete_photo_confirm': 'Remove this photo from your profile?',
  'profile.photos_max': 'You can add up to {count} photos.',
  'profile.photo_viewer_hint': 'Drag down to close',
  'profile.photo_viewer_hint_swipe': 'Swipe left or right · drag down to close',
  'profile.photo_permission': 'Photo library permission is required.',
  'profile.photo_error': 'Could not add photo. Try again.',
  'profile.photo_native_missing':
    'Photo picker needs a full app rebuild. Stop Metro, run yarn ios, then try again.',
  'profile.stat_photos': 'Photos',
  'profile.friends': 'Friends',
  'profile.friends_empty': 'No friends to show yet.',
  'profile.see_all': 'See all',
  'profile.online': 'Online',
  'profile.offline': 'offline',
  'profile.retry': 'Try again',
  'profile.loading': 'Loading profile...',
  'profile.session_missing': 'Session not found.',
  'profile.load_failed': 'Failed to load profile.',
  'profile.bio': 'Bio',
  'profile.bio_save_failed': 'Failed to save bio.',
  'profile.status_title': 'Status',
  'profile.status_add': 'Add status',
  'profile.status_edit': 'Edit status',
  'profile.status_hint':
    'Short text or emoji. Auto-deletes after 24 hours. Max {count} characters.',
  'profile.status_placeholder': 'e.g. ☕ Coffee break',
  'profile.status_save': 'Save',
  'profile.status_cancel': 'Cancel',
  'profile.status_clear': 'Delete',
  'profile.status_error': 'Could not update status. Try again.',
  'user_profile.title': 'Profile',
  'user_profile.not_found_title': 'User not found',
  'user_profile.not_found_desc': 'This profile is no longer available.',
  'user_profile.message': 'Send message',
  'user_profile.message_friends_only':
    'Add them as a friend first to start messaging.',
  'user_profile.offline': 'Offline',
  'user_profile.stat_mutual': 'Mutual',
  'user_profile.stat_age': 'Age',
  'user_profile.unit_km': 'km',
  'user_profile.add_friend': 'Add friend',
  'user_profile.request_sent': 'Request sent',
  'user_profile.accept_request': 'Accept request',
  'user_profile.friends': 'Friends',
  'user_profile.unfriend': 'Unfriend',
  'user_profile.unfriend_title': 'Remove friend?',
  'user_profile.unfriend_confirm':
    'You will no longer be friends. You can send a new request later.',
  'user_profile.like': 'Like',
  'user_profile.liked': 'Liked',
  'user_profile.bio_empty': 'No bio yet.',
  'user_profile.action_error': 'Something went wrong. Try again.',
  'home.greeting': 'Hello',
  'home.messages': 'Messages',
  'home.search_placeholder': 'Discover people nearby',
  'home.hero_badge': 'Premium',
  'home.hero_title': 'Go further\nwith Premium',
  'home.hero_subtitle':
    'See profile visitors, send unlimited treats, browse ad-free, and stay on top Nearby.',
  'home.hero_cta': 'See plans',
  'home.nearby_card_title': 'Discover people\nnearby',
  'home.nearby_card_subtitle':
    'Tap the Meerk logo to scan who’s around you right now.',
  'home.nearby_card_cta': 'Open Nearby',
  'home.nearby_section': 'Nearby',
  'home.see_all': 'See all',
  'home.nearby_empty': 'No one nearby yet. Open Nearby to scan.',
  'home.activity_section': 'Activity',
  'home.activity_empty': 'No activity yet.',
  'home.activity.match': 'matched with you',
  'home.activity.like': 'liked you',
  'home.activity.visit': 'viewed your profile',
  'home.activity.request': 'sent a request',
  'stories.your_story': 'Your story',
  'stories.add': 'Add story',
  'stories.compose_title': 'New story',
  'stories.caption_placeholder': 'Add a caption…',
  'stories.from_gallery': 'Choose from gallery',
  'stories.camera_or_gallery':
    'Take a photo or up to 15s video, or pick from your gallery.',
  'stories.share': 'Share',
  'stories.uploading': 'Uploading…',
  'stories.video_selected': 'Video selected',
  'stories.delete': 'Delete',
  'stories.delete_title': 'Delete story?',
  'stories.delete_confirm': 'This story will be removed for everyone.',
  'stories.delete_error': 'Could not delete story.',
  'stories.error_title': 'Stories',
  'stories.pick_error': 'Could not open your library.',
  'stories.picker_missing': 'Rebuild the app to enable media picker.',
  'stories.upload_error': 'Could not upload story. Try again.',
  'messages.title': 'Messages',
  'messages.subtitle': 'Your conversations',
  'messages.subtitle_unread': '{count} unread',
  'messages.search_placeholder': 'Search chats',
  'messages.empty_title': 'No messages yet',
  'messages.empty_desc': 'Start a chat from a friend’s profile.',
  'messages.no_results_title': 'No chats found',
  'messages.no_results_desc': 'No conversations match "{query}".',
  'messages.status_online': 'Online',
  'messages.status_offline': 'Offline',
  'messages.status_typing': 'Typing…',
  'messages.composer_placeholder': 'Write a message…',
  'messages.more': 'More',
  'messages.delete': 'Delete',
  'messages.delete_confirm_title': 'Delete message?',
  'messages.delete_confirm_desc': 'This message will be removed from the chat.',
  'messages.thread_not_found_title': 'Chat not found',
  'messages.thread_not_found_desc': 'This conversation is no longer available.',
  'messages.no_messages_yet': 'No messages yet',
  'messages.empty_thread_title': 'Say hello',
  'messages.empty_thread_desc': 'This is the start of your conversation.',
  'messages.send_failed_title': 'Message not sent',
  'messages.send_failed_desc': 'Check your connection and try again.',
  'notifications.title': 'Notifications',
  'notifications.subtitle': 'Your latest activity',
  'notifications.subtitle_unread': '{count} unread',
  'notifications.empty_title': 'No notifications yet',
  'notifications.empty_desc': 'Likes, visits and friend requests will show up here.',
  'notifications.mark_all_read': 'Mark all read',
  'notifications.type.like': '{name} liked you',
  'notifications.type.match': 'You matched with {name}',
  'notifications.type.visit': '{name} viewed your profile',
  'notifications.type.friend_request': '{name} sent a friend request',
  'notifications.type.friend_accept': '{name} accepted your request',
  'notifications.type.message': '{name} sent you a message',
  'friends.people': 'people',
  'friends.search': 'Search your friends',
  'friends.mutual': 'mutual',
  'friends.title': 'Friends',
  'friends.subtitle': '{count} connections',
  'friends.tab.friends': 'Friends',
  'friends.tab.incoming': 'Incoming',
  'friends.tab.sent': 'Sent',
  'friends.empty_title': 'No friends yet',
  'friends.empty_desc': 'Add friends from people nearby to get started.',
  'friends.incoming_empty_title': 'No new requests',
  'friends.incoming_empty_desc': 'Incoming friend requests show up here.',
  'friends.sent_empty_title': 'No pending requests',
  'friends.sent_empty_desc': 'Requests you send are listed here.',
  'friends.online': 'Online',
  'friends.offline': 'offline',
  'friends.offline_meta': '{lastActive} · {mutual} mutual',
  'friends.incoming_meta': '{count} mutual friends · {time}',
  'friends.sent_meta': 'Sent · {time}',
  'friends.accept': 'Accept',
  'friends.reject': 'Decline',
  'friends.cancel': 'Cancel',
  'friends.added': 'Added',
  'friends.pending': 'Pending',
  'friends.search_title': 'Search users',
  'friends.search_placeholder': 'Name or username',
  'friends.suggested': 'Suggested',
  'friends.add': 'Add',
  'friends.no_results_title': 'No results',
  'friends.no_results_desc': 'No users match "{query}".',
  // Edit profile
  'edit.title': 'Edit Profile',
  'edit.first_name': 'First name',
  'edit.last_name': 'Last name',
  'edit.username': 'Username',
  'edit.email': 'Email',
  'edit.phone': 'Phone',
  'edit.interests': 'Interests',
  'edit.interests_hint':
    'Fill every interest to stay verified. Clearing any one removes verification.',
  'edit.answer_placeholder': 'Your {name} answer...',
  'edit.save_changes': 'Save changes',
  'edit.saving': 'Saving...',
  'edit.loading': 'Loading profile info...',
  'edit.profile': 'Profile',
  'edit.session_missing': 'Your session has expired. Please sign in again.',
  'edit.interests_alert': 'Interests',
  'edit.min_one_interest': 'Enter at least one interest answer.',
  'edit.account': 'Account',
  'edit.account_locked': 'These details are set at registration and can’t be edited here.',
  'edit.no_interest_types': 'No interest categories yet',
  'edit.no_interest_types_desc':
    'Categories will show up here as soon as they are available.',
  'edit.load_error_title': 'We couldn’t load your profile',
  'edit.load_error_desc': 'Check your connection and try again.',
  'edit.save_error_title': 'Changes not saved',
  'edit.save_error_desc': 'Your answers are still here — please try again.',
  'edit.saved': 'Profile updated',
  'edit.add_interest': 'Add',
  'edit.apply_interest': 'Done',
  'edit.clear_interest': 'Clear',
  'edit.interest_sheet_hint': 'Write a short answer for this category.',
  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.preferences': 'Preferences',
  'settings.dating': 'Dating settings',
  'settings.security': 'Security',
  'settings.support': 'Support',
  'settings.danger': 'Danger zone',
  'settings.appearance': 'Appearance',
  'settings.discover': 'Discover',
  'settings.notifications': 'Notifications',
  'settings.privacy_support': 'Privacy & Support',
  'settings.theme': 'Theme',
  'settings.theme_light': 'Light',
  'settings.theme_dark': 'Dark',
  'settings.theme_system': 'System',
  'settings.color': 'Color',
  'settings.filter': 'Filters',
  'settings.filter_desc': 'Age, visibility',
  'filter.title': 'Filters',
  'filter.reset': 'Reset filters',
  'filter.age_section': 'Age range',
  'filter.age_label': 'Show ages',
  'filter.age_hint':
    'You only see people in this age range, and only people in this range can see you.',
  'filter.show_me_section': 'Who I want to see',
  'filter.show_me_hint':
    'Choose who appears in Discover and Nearby.',
  'filter.visible_to_section': 'Who can see me',
  'filter.visible_to_hint':
    'Choose who can see your profile. You can select more than one option.',
  'filter.option.women': 'Women',
  'filter.option.men': 'Men',
  'filter.option.lgbt': 'LGBTQ+',
  'filter.option.everyone': 'Everyone',
  'filter.apply': 'Apply filters',
  'filter.saving': 'Saving…',
  'filter.save_note': 'Your filters are saved to your account.',
  'filter.save_failed': 'Could not save filters. Please try again.',
  'filter.preview_note': 'This screen is a design preview for now.',
  'settings.account_info': 'Account details',
  'settings.password': 'Password',
  'auth.current_password': 'Current password',
  'auth.current_password_hint': 'Enter your current password',
  'auth.current_password_required': 'Please enter your current password',
  'auth.current_password_incorrect': 'Current password is incorrect',
  'auth.new_password': 'New password',
  'auth.change_password': 'Change password',
  'auth.change_password_hint':
    'Choose a new password with at least 8 characters.',
  'auth.password_same_as_current':
    'New password must be different from the current one',
  'auth.password_changed': 'Your password has been updated',
  'auth.password_change_failed': 'Could not change password. Please try again.',
  'auth.password_saving': 'Saving…',
  'settings.premium': 'Premium',
  'settings.premium_active': 'Active',
  'settings.premium_inactive': 'Free',
  'settings.notif_push': 'Push notifications',
  'settings.notif_matches': 'Matches',
  'settings.notif_messages': 'Messages',
  'settings.notif_marketing': 'Campaigns',
  'settings.privacy': 'Privacy',
  'settings.privacy_desc': 'Visibility & your data',
  'settings.help': 'Help',
  'settings.help_desc': 'Tips & common questions',
  'settings.language': 'Language',
  'settings.language_hint': 'App language',
  'settings.sign_out': 'Sign out',
  'settings.sign_out_confirm': 'Are you sure you want to sign out?',
  'settings.cancel': 'Cancel',
  'settings.version': 'Meerk · v0.1.0',
  'privacy.title': 'Privacy',
  'privacy.intro':
    'Meerk is built so you stay in control of who finds you and what you share nearby.',
  'privacy.section_visibility_title': 'Who can see you',
  'privacy.section_visibility_body':
    'Use Filters → Who can see me to choose who may discover your profile during Nearby scans. People outside that choice will not see you in their results.',
  'privacy.section_filters_title': 'Who you see',
  'privacy.section_filters_body':
    'Show me and age range control who appears in your Nearby list. Your preferences are saved to your account and applied on every scan.',
  'privacy.section_data_title': 'Your account data',
  'privacy.section_data_body':
    'Profile details, photos, and messages stay tied to your account. You can change your password anytime from Settings → Password.',
  'privacy.section_ble_title': 'Nearby & Bluetooth',
  'privacy.section_ble_body':
    'Nearby uses Bluetooth to sense proximity. We match short-lived presence tokens — not your name or phone number — and only show people who pass mutual filter rules.',
  'privacy.footer': 'This summary will grow as Meerk’s privacy policy is finalized.',
  'help.title': 'Help',
  'help.intro': 'Quick answers for getting the most out of Meerk.',
  'help.tips_title': 'Getting started',
  'help.tips_body':
    'Complete your profile, add a photo, set Filters, then open Nearby and tap the Meerk logo to scan who’s around you.',
  'help.faq_label': 'FAQ',
  'help.faq_nearby_q': 'How does Nearby work?',
  'help.faq_nearby_a':
    'Nearby looks for people close by over Bluetooth. Keep Bluetooth on, stay near others using Meerk, and pull to refresh or tap the logo to scan again.',
  'help.faq_filters_q': 'Why don’t I see someone nearby?',
  'help.faq_filters_a':
    'Filters cut both ways. They must match your Show me / age settings, and you must match their Who can see me choice.',
  'help.faq_friends_q': 'How do friend requests work?',
  'help.faq_friends_a':
    'Open a profile and tap Add friend. Incoming requests appear under Friends → Incoming. Accept to connect.',
  'help.faq_messages_q': 'Who can I message?',
  'help.faq_messages_a':
    'Messaging is for friends. Send a request first, then open Messages or Send message from their profile.',
  'help.faq_password_q': 'How do I change my password?',
  'help.faq_password_a':
    'Go to Settings → Password, enter your current password, then choose a new one with at least 8 characters.',
  'help.contact_title': 'Still stuck?',
  'help.contact_body':
    'Reach us at support@meerk.app — we’re happy to help while Meerk is in early access.',
  'nearby.title': 'Nearby',
  'nearby.eyebrow': 'Around you',
  'nearby.count': '{count} people · {online} online',
  'nearby.filter': 'Filters',
  'nearby.filter_all': 'All',
  'nearby.filter_online': 'Online',
  'nearby.filter_near': '< 2 km',
  'nearby.empty_title': 'No one nearby',
  'nearby.ble_permission_denied':
    'Bluetooth permission is required to discover people nearby.',
  'nearby.empty_desc':
    'Tap the Meerk logo to scan who’s around you. Move closer and try again if needed.',
  'nearby.scanning': 'Scanning nearby…',
  'nearby.scanning_hint': 'Looking for people around you, just like on launch.',
  'nearby.scan_action': 'Scan nearby',
  'nearby.scan_banner': 'Tap the Meerk logo to scan who’s around you.',
  'nearby.scan_prompt': 'Tap the Meerk logo to scan who’s around you.',
  'nearby.scan_cancel': 'Stop scan',
  'nearby.verified_required_title': 'Verification required',
  'nearby.verified_required_desc':
    'Complete your interests and add at least one photo to use Nearby.',
  'nearby.verified_required_action': 'Go to profile',
  'nearby.add_friend_error': 'Could not send friend request.',
  'premium.title': 'Meerk Premium',
  'premium.subtitle':
    'See who visited you, send unlimited treats, go ad-free, and stay on top nearby.',
  'premium.trial': 'First 7 days free',
  'premium.choose_plan': 'Choose a plan',
  'premium.popular': 'Popular',
  'premium.renews': 'Renews monthly',
  'premium.features_standard': 'Premium features',
  'premium.features_plus': 'Premium+ features',
  'premium.cta': 'Upgrade to Premium',
  'premium.cta_plus': 'Upgrade to Premium+',
  'premium.plus_badge': 'Plus',
  'premium.plan.period': '/mo',
  'premium.plan.standard.name': 'Premium',
  'premium.plan.standard.tagline': 'Standard',
  'premium.plan.standard.highlight': 'Core package',
  'premium.plan.plus.name': 'Premium+',
  'premium.plan.plus.tagline': 'Plus',
  'premium.plan.plus.highlight': 'Ghost Mode',
  'premium.plan.plus.per_month': 'All Standard features +',
  'premium.perk.visitors.title': 'See who visited your profile',
  'premium.perk.visitors.desc':
    'See users who visited your profile. Spot who’s interested and engage at the right time.',
  'premium.perk.treats.title': 'Unlimited treats',
  'premium.perk.treats.desc':
    'Send unlimited treats for their favorite food, dessert, coffee, and drinks. No extra fees or limits.',
  'premium.perk.adfree.title': 'Ad-free experience',
  'premium.perk.adfree.desc':
    'The app runs completely ad-free — faster, uninterrupted, and smoother.',
  'premium.perk.featured.title': 'Get featured',
  'premium.perk.featured.desc':
    'Always appear at the top of Nearby with no distance limit.',
  'premium.perk.ghost.title': 'Ghost Mode',
  'premium.perk.ghost.desc':
    'See people around you and browse profiles; stay fully invisible until you make the first move.',
};

/**
 * Turkish overrides for keys the backend does not (yet) provide. Backend
 * translations always win; these guarantee correct Turkish copy offline and
 * for screen-local strings that only live in the app.
 */
const LOCAL_TRANSLATIONS_TR: Record<string, string> = {
  'auth.age': 'Yaş',
  'auth.age_unit': 'yaşında',
  'auth.age_hint': 'Kaydırarak veya dokunarak seç. En az 18.',
  'auth.age_required': 'Lütfen yaşını seç',
  'auth.age_invalid': '18 ile 100 arasında geçerli bir yaş gir',
  'auth.age_too_young': 'En az 18 yaşında olmalısın',
  'auth.birth_date_required': 'Doğum tarihi zorunludur',
  'auth.birth_date_invalid': 'Geçerli bir doğum tarihi gir',
  'splash.brand': 'Meerk',
  'splash.tagline': 'Yeni bağlantılar burada başlar',
  'profile.edit': 'Profili Düzenle',
  'profile.edit_action': 'Düzenle',
  'profile.add_bio': 'Biyografi ekle',
  'profile.add_bio_desc':
    'Kendini kısaca tanıt, profilin daha dikkat çeksin.',
  'profile.stat_friends': 'Arkadaş',
  'profile.stat_likes': 'Beğeni',
  'profile.stat_visits': 'Ziyaret',
  'profile.interests': 'İlgi alanları',
  'profile.add_interests': 'İlgi alanlarını ekle',
  'profile.categories_ready': 'kategori hazır. Favorilerini yaz.',
  'profile.interests_empty': 'Favorilerini yazarak profilini tamamla.',
  'profile.not_verified': 'Onaylı değil',
  'profile.verified_badge': 'Onaylı hesap',
  'profile.verify_requires_interests':
    'Onaylı olmak için tüm ilgi alanlarını doldur ve en az bir fotoğraf ekle.',
  'profile.photos': 'Fotoğraflar',
  'profile.photos_empty': 'İlk fotoğrafını ekle',
  'profile.add_photo': 'Fotoğraf ekle',
  'profile.change_avatar': 'Profil fotoğrafını değiştir',
  'profile.delete_photo': 'Sil',
  'profile.delete_photo_confirm': 'Bu fotoğraf profilinden kaldırılsın mı?',
  'profile.photos_max': 'En fazla {count} fotoğraf ekleyebilirsin.',
  'profile.photo_viewer_hint': 'Kapatmak için aşağı kaydır',
  'profile.photo_viewer_hint_swipe': 'Sağa/sola kaydır · aşağı çekerek kapat',
  'profile.photo_permission': 'Fotoğraf kütüphanesi izni gerekli.',
  'profile.photo_error': 'Fotoğraf eklenemedi. Tekrar dene.',
  'profile.photo_native_missing':
    'Fotoğraf seçici için uygulamayı yeniden derlemen gerekiyor. Metro’yu durdur, yarn ios çalıştır, sonra tekrar dene.',
  'profile.stat_photos': 'Fotoğraf',
  'profile.friends': 'Arkadaşlar',
  'profile.friends_empty': 'Henüz gösterilecek arkadaş yok.',
  'profile.see_all': 'Tümünü gör',
  'profile.online': 'Çevrimiçi',
  'profile.offline': 'çevrimdışı',
  'profile.retry': 'Tekrar dene',
  'common.back': 'Geri',
  'common.close': 'Kapat',
  'common.error_generic': 'Bir hata oluştu.',
  'profile.loading': 'Profil yükleniyor...',
  'profile.session_missing': 'Oturum bilgisi bulunamadı.',
  'profile.load_failed': 'Profil yüklenemedi.',
  'profile.bio': 'Biyografi',
  'profile.bio_save_failed': 'Biyografi kaydedilemedi.',
  'profile.status_title': 'Durum',
  'profile.status_add': 'Durum ekle',
  'profile.status_edit': 'Durumu düzenle',
  'profile.status_hint':
    'Kısa yazı veya emoji. 24 saat sonra otomatik silinir. En fazla {count} karakter.',
  'profile.status_placeholder': 'Örn: ☕ Kahve molası',
  'profile.status_save': 'Kaydet',
  'profile.status_cancel': 'Vazgeç',
  'profile.status_clear': 'Sil',
  'profile.status_error': 'Durum güncellenemedi. Tekrar dene.',
  'user_profile.title': 'Profil',
  'user_profile.not_found_title': 'Kullanıcı bulunamadı',
  'user_profile.not_found_desc': 'Bu profil artık mevcut değil.',
  'user_profile.message': 'Mesaj gönder',
  'user_profile.message_friends_only':
    'Mesajlaşmak için önce arkadaş olarak eklemelisin.',
  'user_profile.offline': 'Çevrimdışı',
  'user_profile.stat_mutual': 'Ortak',
  'user_profile.stat_age': 'Yaş',
  'user_profile.unit_km': 'km',
  'user_profile.add_friend': 'Arkadaş ekle',
  'user_profile.request_sent': 'İstek gönderildi',
  'user_profile.accept_request': 'İsteği kabul et',
  'user_profile.friends': 'Arkadaşlar',
  'user_profile.unfriend': 'Arkadaşlıktan çıkar',
  'user_profile.unfriend_title': 'Arkadaşlıktan çıkarılsın mı?',
  'user_profile.unfriend_confirm':
    'Artık arkadaş olmayacaksınız. İsterseniz sonra yeniden istek gönderebilirsiniz.',
  'user_profile.like': 'Beğen',
  'user_profile.liked': 'Beğenildi',
  'user_profile.bio_empty': 'Henüz biyografi eklenmemiş.',
  'user_profile.action_error': 'Bir şeyler ters gitti. Tekrar dene.',
  'home.greeting': 'Merhaba',
  'home.messages': 'Mesajlar',
  'home.search_placeholder': 'Yakındaki kişileri keşfet',
  'home.hero_badge': 'Premium',
  'home.hero_title': "Premium ile\ndaha öne çık",
  'home.hero_subtitle':
    'Profil ziyaretçilerini gör, sınırsız ısmarla, reklamsız gez ve Nearby’de en üstte ol.',
  'home.hero_cta': 'Planlara bak',
  'home.nearby_card_title': 'Yakındaki kişileri\nkeşfet',
  'home.nearby_card_subtitle':
    'Meerk logosuna dokun, şu an çevrendeki kişileri tara.',
  'home.nearby_card_cta': 'Nearby’e git',
  'home.nearby_section': 'Yakında',
  'home.see_all': 'Tümü',
  'home.nearby_empty': 'Henüz kimse yok. Taramak için Nearby’e geç.',
  'home.activity_section': 'Aktivite',
  'home.activity_empty': 'Henüz aktivite yok.',
  'home.activity.match': 'ile eşleştin',
  'home.activity.like': 'seni beğendi',
  'home.activity.visit': 'profiline baktı',
  'home.activity.request': 'istek gönderdi',
  'stories.your_story': 'Hikâyen',
  'stories.add': 'Hikâye ekle',
  'stories.compose_title': 'Yeni hikâye',
  'stories.caption_placeholder': 'Bir yazı ekle…',
  'stories.from_gallery': 'Galeriden seç',
  'stories.camera_or_gallery':
    'Fotoğraf veya en fazla 15 sn video çek, ya da galeriden seç.',
  'stories.share': 'Paylaş',
  'stories.uploading': 'Yükleniyor…',
  'stories.video_selected': 'Video seçildi',
  'stories.delete': 'Sil',
  'stories.delete_title': 'Hikâye silinsin mi?',
  'stories.delete_confirm': 'Bu hikâye herkes için kaldırılacak.',
  'stories.delete_error': 'Hikâye silinemedi.',
  'stories.error_title': 'Hikâyeler',
  'stories.pick_error': 'Galerin açılamadı.',
  'stories.picker_missing': 'Medya seçici için uygulamayı yeniden derle.',
  'stories.upload_error': 'Hikâye yüklenemedi. Tekrar dene.',
  'messages.title': 'Mesajlar',
  'messages.subtitle': 'Sohbetlerin',
  'messages.subtitle_unread': '{count} okunmamış',
  'messages.search_placeholder': 'Sohbetlerde ara',
  'messages.empty_title': 'Henüz mesaj yok',
  'messages.empty_desc': 'Bir arkadaşın profilinden sohbet başlat.',
  'messages.no_results_title': 'Sohbet bulunamadı',
  'messages.no_results_desc': '"{query}" ile eşleşen sohbet yok.',
  'messages.status_online': 'Çevrimiçi',
  'messages.status_offline': 'Çevrimdışı',
  'messages.status_typing': 'Yazıyor…',
  'messages.composer_placeholder': 'Bir mesaj yaz…',
  'messages.more': 'Daha fazla',
  'messages.delete': 'Sil',
  'messages.delete_confirm_title': 'Mesaj silinsin mi?',
  'messages.delete_confirm_desc': 'Bu mesaj sohbetten kaldırılacak.',
  'messages.thread_not_found_title': 'Sohbet bulunamadı',
  'messages.thread_not_found_desc': 'Bu konuşma artık mevcut değil.',
  'messages.no_messages_yet': 'Henüz mesaj yok',
  'messages.empty_thread_title': 'Merhaba de',
  'messages.empty_thread_desc': 'Sohbetinizin başlangıcı burası.',
  'messages.send_failed_title': 'Mesaj gönderilemedi',
  'messages.send_failed_desc': 'Bağlantını kontrol edip tekrar dene.',
  'notifications.title': 'Bildirimler',
  'notifications.subtitle': 'Son aktivitelerin',
  'notifications.subtitle_unread': '{count} okunmamış',
  'notifications.empty_title': 'Henüz bildirim yok',
  'notifications.empty_desc': 'Beğeniler, ziyaretler ve arkadaşlık istekleri burada görünür.',
  'notifications.mark_all_read': 'Tümünü okundu say',
  'notifications.type.like': '{name} seni beğendi',
  'notifications.type.match': '{name} ile eşleştin',
  'notifications.type.visit': '{name} profiline baktı',
  'notifications.type.friend_request': '{name} arkadaşlık isteği gönderdi',
  'notifications.type.friend_accept': '{name} isteğini kabul etti',
  'notifications.type.message': '{name} sana mesaj gönderdi',
  'friends.people': 'kişi',
  'friends.search': 'Arkadaşlarında ara',
  'friends.mutual': 'ortak',
  'friends.title': 'Arkadaşlar',
  'friends.subtitle': '{count} bağlantı',
  'friends.tab.friends': 'Arkadaşlar',
  'friends.tab.incoming': 'Gelen',
  'friends.tab.sent': 'Gönderilen',
  'friends.empty_title': 'Henüz arkadaşın yok',
  'friends.empty_desc': 'Yakındaki kişilerden arkadaş ekleyerek başla.',
  'friends.incoming_empty_title': 'Yeni istek yok',
  'friends.incoming_empty_desc': 'Gelen arkadaşlık istekleri burada görünür.',
  'friends.sent_empty_title': 'Bekleyen istek yok',
  'friends.sent_empty_desc': 'Gönderdiğin istekler burada listelenir.',
  'friends.online': 'Çevrimiçi',
  'friends.offline': 'çevrimdışı',
  'friends.offline_meta': '{lastActive} · {mutual} ortak',
  'friends.incoming_meta': '{count} ortak arkadaş · {time}',
  'friends.sent_meta': 'Gönderildi · {time}',
  'friends.accept': 'Kabul et',
  'friends.reject': 'Reddet',
  'friends.cancel': 'İptal',
  'friends.added': 'Eklendi',
  'friends.pending': 'Bekliyor',
  'friends.search_title': 'Kullanıcı Ara',
  'friends.search_placeholder': 'İsim veya kullanıcı adı',
  'friends.suggested': 'Önerilenler',
  'friends.add': 'Ekle',
  'friends.no_results_title': 'Sonuç bulunamadı',
  'friends.no_results_desc': '"{query}" için eşleşen kullanıcı yok.',
  'edit.title': 'Profili Düzenle',
  'edit.first_name': 'Ad',
  'edit.last_name': 'Soyad',
  'edit.username': 'Kullanıcı adı',
  'edit.email': 'E-posta',
  'edit.phone': 'Telefon',
  'edit.interests': 'İlgi alanları',
  'edit.interests_hint':
    'Onaylı kalmak için tüm ilgi alanlarını doldur. Birini silersen onay kalkar.',
  'edit.answer_placeholder': '{name} cevabın...',
  'edit.save_changes': 'Değişiklikleri kaydet',
  'edit.saving': 'Kaydediliyor...',
  'edit.loading': 'Profil bilgileri yükleniyor...',
  'edit.profile': 'Profil',
  'edit.session_missing': 'Oturumun sona ermiş. Lütfen tekrar giriş yap.',
  'edit.interests_alert': 'İlgi alanları',
  'edit.min_one_interest': 'En az bir ilgi alanı cevabı gir.',
  'edit.account': 'Hesap',
  'edit.account_locked':
    'Bu bilgiler kayıt sırasında belirlenir, burada değiştirilemez.',
  'edit.no_interest_types': 'Henüz ilgi alanı kategorisi yok',
  'edit.no_interest_types_desc':
    'Kategoriler hazır olduğunda burada görünecek.',
  'edit.load_error_title': 'Profilin yüklenemedi',
  'edit.load_error_desc': 'Bağlantını kontrol edip tekrar dene.',
  'edit.save_error_title': 'Değişiklikler kaydedilemedi',
  'edit.save_error_desc': 'Cevapların duruyor — lütfen tekrar dene.',
  'edit.saved': 'Profilin güncellendi',
  'edit.add_interest': 'Ekle',
  'edit.apply_interest': 'Tamam',
  'edit.clear_interest': 'Temizle',
  'edit.interest_sheet_hint': 'Bu kategori için kısa bir cevap yaz.',
  'settings.title': 'Ayarlar',
  'settings.account': 'Hesap',
  'settings.preferences': 'Tercihler',
  'settings.dating': 'Dating ayarları',
  'settings.security': 'Güvenlik',
  'settings.support': 'Destek',
  'settings.danger': 'Tehlikeli alan',
  'settings.appearance': 'Görünüm',
  'settings.discover': 'Keşfet',
  'settings.notifications': 'Bildirimler',
  'settings.privacy_support': 'Gizlilik & Destek',
  'settings.theme': 'Tema',
  'settings.theme_light': 'Açık',
  'settings.theme_dark': 'Koyu',
  'settings.theme_system': 'Sistem',
  'settings.color': 'Renk',
  'settings.filter': 'Filtreleme',
  'settings.filter_desc': 'Yaş, görünürlük',
  'filter.title': 'Filtreleme',
  'filter.reset': 'Filtreleri sıfırla',
  'filter.age_section': 'Yaş aralığı',
  'filter.age_label': 'Gösterilecek yaş',
  'filter.age_hint':
    'Sana yalnızca bu yaş aralığındaki kişiler gösterilir ve sen de yalnızca bu aralıktaki kişilere görünürsün.',
  'filter.show_me_section': 'Kimleri görmek istiyorum',
  'filter.show_me_hint':
    'Keşfet ve yakındakiler ekranında karşına çıkacak kişileri seç.',
  'filter.visible_to_section': 'Beni kimler görebilsin',
  'filter.visible_to_hint':
    'Profilinin kimlere gösterileceğini belirle. Birden fazla seçenek işaretleyebilirsin.',
  'filter.option.women': 'Kadınlar',
  'filter.option.men': 'Erkekler',
  'filter.option.lgbt': 'LGBTQ+',
  'filter.option.everyone': 'Herkes',
  'filter.apply': 'Filtreleri uygula',
  'filter.saving': 'Kaydediliyor…',
  'filter.save_note': 'Filtrelerin hesabına kaydedilir.',
  'filter.save_failed': 'Filtreler kaydedilemedi. Lütfen tekrar dene.',
  'filter.preview_note': 'Bu ekran şimdilik yalnızca tasarım önizlemesidir.',
  'settings.account_info': 'Hesap bilgileri',
  'settings.password': 'Şifre',
  'auth.current_password': 'Mevcut şifre',
  'auth.current_password_hint': 'Mevcut şifreni gir',
  'auth.current_password_required': 'Lütfen mevcut şifreni gir',
  'auth.current_password_incorrect': 'Mevcut şifre hatalı',
  'auth.new_password': 'Yeni şifre',
  'auth.change_password': 'Şifreyi değiştir',
  'auth.change_password_hint': 'En az 8 karakterlik yeni bir şifre seç.',
  'auth.password_same_as_current': 'Yeni şifre mevcut şifreden farklı olmalı',
  'auth.password_changed': 'Şifren güncellendi',
  'auth.password_change_failed':
    'Şifre değiştirilemedi. Lütfen tekrar dene.',
  'auth.password_saving': 'Kaydediliyor…',
  'settings.premium': 'Premium',
  'settings.premium_active': 'Aktif',
  'settings.premium_inactive': 'Ücretsiz',
  'settings.notif_push': 'Anlık bildirimler',
  'settings.notif_matches': 'Eşleşmeler',
  'settings.notif_messages': 'Mesajlar',
  'settings.notif_marketing': 'Kampanyalar',
  'settings.privacy': 'Gizlilik',
  'settings.privacy_desc': 'Görünürlük ve verilerin',
  'settings.help': 'Yardım',
  'settings.help_desc': 'İpuçları ve sık sorulanlar',
  'settings.language': 'Dil',
  'settings.language_hint': 'Uygulama dili',
  'settings.sign_out': 'Çıkış Yap',
  'settings.sign_out_confirm': 'Hesabından çıkmak istediğine emin misin?',
  'settings.cancel': 'Vazgeç',
  'settings.version': 'Meerk · v0.1.0',
  'privacy.title': 'Gizlilik',
  'privacy.intro':
    'Meerk, yakında seni kimin bulacağını ve ne paylaşacağını senin kontrolünde tutmak için tasarlandı.',
  'privacy.section_visibility_title': 'Seni kimler görebilir',
  'privacy.section_visibility_body':
    'Filtreler → Beni kimler görebilsin ile Nearby taramasında profilini kimlerin görebileceğini seç. Bu seçimin dışındakiler sonuçlarında seni görmez.',
  'privacy.section_filters_title': 'Sen kimi görürsün',
  'privacy.section_filters_body':
    'Kimleri görmek istiyorum ve yaş aralığı Nearby listenizi belirler. Tercihler hesabına kaydedilir ve her taramada uygulanır.',
  'privacy.section_data_title': 'Hesap verilerin',
  'privacy.section_data_body':
    'Profil, fotoğraflar ve mesajlar hesabına bağlıdır. Şifreni istediğin zaman Ayarlar → Şifre’den değiştirebilirsin.',
  'privacy.section_ble_title': 'Nearby ve Bluetooth',
  'privacy.section_ble_body':
    'Nearby yakınlığı Bluetooth ile algılar. Kısa ömürlü presence token’ları eşleştiririz — adın veya telefonun değil — ve yalnızca karşılıklı filtre kurallarını geçenleri gösteririz.',
  'privacy.footer':
    'Bu özet, Meerk gizlilik politikası netleştikçe genişleyecek.',
  'help.title': 'Yardım',
  'help.intro': 'Meerk’ten en iyi şekilde yararlanmak için kısa cevaplar.',
  'help.tips_title': 'Başlangıç',
  'help.tips_body':
    'Profilini tamamla, bir fotoğraf ekle, Filtreleri ayarla, sonra Nearby’ı açıp Meerk logosuna dokunarak çevrendekileri tara.',
  'help.faq_label': 'SSS',
  'help.faq_nearby_q': 'Nearby nasıl çalışır?',
  'help.faq_nearby_a':
    'Nearby, Bluetooth ile yakındaki kişileri arar. Bluetooth açık olsun, Meerk kullananlara yakın dur, yenilemek için kaydır veya logoya dokun.',
  'help.faq_filters_q': 'Yakındaki birini neden görmüyorum?',
  'help.faq_filters_a':
    'Filtreler çift yönlüdür. Karşı taraf senin “görmek istediğim / yaş” ayarına uymalı; sen de onun “beni kimler görebilsin” seçimine uymalısın.',
  'help.faq_friends_q': 'Arkadaşlık istekleri nasıl işler?',
  'help.faq_friends_a':
    'Bir profile girip Arkadaş ekle’ye dokun. Gelen istekler Arkadaşlar → Gelen’de görünür. Kabul ederek bağlantı kurarsın.',
  'help.faq_messages_q': 'Kime mesaj atabilirim?',
  'help.faq_messages_a':
    'Mesajlaşma arkadaşlar içindir. Önce istek gönder, sonra Mesajlar’dan veya profildeki Mesaj gönder’den yaz.',
  'help.faq_password_q': 'Şifremi nasıl değiştiririm?',
  'help.faq_password_a':
    'Ayarlar → Şifre’ye gir, mevcut şifreni yaz, en az 8 karakterlik yeni bir şifre seç.',
  'help.contact_title': 'Hâlâ takıldın mı?',
  'help.contact_body':
    'support@meerk.app adresinden bize yaz — erken erişimde yardımcı olmaktan mutluluk duyarız.',
  'nearby.title': 'Yakındakiler',
  'nearby.eyebrow': 'Konumuna göre',
  'nearby.count': '{count} kişi · {online} çevrimiçi',
  'nearby.filter': 'Filtreler',
  'nearby.filter_all': 'Tümü',
  'nearby.filter_online': 'Çevrimiçi',
  'nearby.filter_near': '< 2 km',
  'nearby.empty_title': 'Kimse bulunamadı',
  'nearby.ble_permission_denied':
    'Yakındakileri bulmak için Bluetooth izni gerekli.',
  'nearby.empty_desc':
    'Yeniden taramak için Meerk logosuna dokun. Gerekirse biraz yaklaşarak tekrar dene.',
  'nearby.scanning': 'Yakındakiler taranıyor…',
  'nearby.scanning_hint': 'Açılıştaki gibi çevrendeki kişiler aranıyor.',
  'nearby.scan_action': 'Yakını tara',
  'nearby.scan_banner': 'Meerk logosuna bas, çevrendekileri tara.',
  'nearby.scan_prompt': 'Yakındakileri görmek için Meerk logosuna dokun.',
  'nearby.scan_cancel': 'Taramayı durdur',
  'nearby.verified_required_title': 'Onay gerekli',
  'nearby.verified_required_desc':
    'Yakındakiler’i kullanmak için tüm ilgi alanlarını doldur ve en az bir fotoğraf ekle.',
  'nearby.verified_required_action': 'Profile git',
  'nearby.add_friend_error': 'Arkadaşlık isteği gönderilemedi.',
  'premium.title': 'Meerk Premium',
  'premium.subtitle':
    'Ziyaretçilerini gör, sınırsız ısmarla, reklamsız kullan ve yakındakilerde öne çık.',
  'premium.trial': 'İlk 7 gün ücretsiz',
  'premium.choose_plan': 'Paketi seç',
  'premium.popular': 'Popüler',
  'premium.renews': 'Her ay yenilenir',
  'premium.features_standard': 'Premium özellikleri',
  'premium.features_plus': 'Premium+ özellikleri',
  'premium.cta': 'Premium’a yükselt',
  'premium.cta_plus': 'Premium+’a yükselt',
  'premium.plus_badge': 'Plus',
  'premium.plan.period': '/ay',
  'premium.plan.standard.name': 'Premium',
  'premium.plan.standard.tagline': 'Standart',
  'premium.plan.standard.highlight': 'Temel paket',
  'premium.plan.plus.name': 'Premium+',
  'premium.plan.plus.tagline': 'Plus',
  'premium.plan.plus.highlight': 'Hayalet Modu',
  'premium.plan.plus.per_month': 'Tüm Standart özellikler +',
  'premium.perk.visitors.title': 'Profilini ziyaret edenleri gör',
  'premium.perk.visitors.desc':
    'Profilini ziyaret eden kullanıcıları gör. Seninle ilgilenenleri fark edip doğru zamanda etkileşime geç.',
  'premium.perk.treats.title': 'Sınırsız ısmarlama',
  'premium.perk.treats.desc':
    'Karşı tarafın favori yemek, tatlı, kahve ve içeceklerine sınırsız ısmarlama gönder. Ek ücret veya limit yok.',
  'premium.perk.adfree.title': 'Reklamsız deneyim',
  'premium.perk.adfree.desc':
    'Uygulama tamamen reklamsız çalışır; daha hızlı, kesintisiz ve akıcı bir deneyim.',
  'premium.perk.featured.title': 'Öne çıkma',
  'premium.perk.featured.desc':
    'Mesafe sınırı olmadan yakındakiler arasında daima en üstte görün.',
  'premium.perk.ghost.title': 'Hayalet Modu',
  'premium.perk.ghost.desc':
    'Çevrendekileri gör ve profillerini incele; ilk etkileşimi sen başlatana kadar tamamen görünmez kal.',
};

function localBaseFor(code: string): Record<string, string> {
  return code.toLowerCase().startsWith('tr')
    ? { ...FALLBACK_TRANSLATIONS, ...LOCAL_TRANSLATIONS_TR }
    : FALLBACK_TRANSLATIONS;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LocaleStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState('en');
  const [languages, setLanguages] = useState<LanguageDto[]>(FALLBACK_LANGUAGES);
  const [translations, setTranslations] = useState<Record<string, string>>(
    FALLBACK_TRANSLATIONS,
  );
  const [device, setDevice] = useState<DeviceState | null>(null);

  const loadTranslations = useCallback(async (code: string) => {
    setApiLanguageCode(code);
    const response = await fetchTranslationsByCode(code);
    const nextCode = response.LanguageCode || code;
    setTranslations({
      ...localBaseFor(nextCode),
      ...(response.Translations ?? {}),
    });
    setApiLanguageCode(nextCode);
    setLanguageCode(nextCode);
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const info = await getDeviceLaunchInfo();
      console.log('[DeviceInfo]', info);
      setApiLanguageCode(info.language);

      const theme =
        info.colorScheme === 'unspecified' ? 'light' : info.colorScheme;

      const [deviceResponse, languagesResponse] = await Promise.all([
        bootstrapDevice({
          DeviceUniqueId: info.uniqueId,
          Platform: info.platform,
          OsVersion: info.osVersion,
          LanguageCode: info.language,
          CultureCode: info.cultureCode,
          Theme: theme,
          PushToken: null,
        }),
        fetchLanguages(),
      ]);

      const nextDevice: DeviceState = {
        id: deviceResponse.Id,
        uniqueId: deviceResponse.DeviceUniqueId,
        languageCode: deviceResponse.LanguageCode,
        cultureCode: deviceResponse.CultureCode ?? null,
        theme: deviceResponse.Theme,
        userId: deviceResponse.UserId ?? null,
        isNew: deviceResponse.IsNew,
      };

      setDevice(nextDevice);
      setLanguages(
        languagesResponse.GetAllLanguagesQueryCommonObject?.length
          ? languagesResponse.GetAllLanguagesQueryCommonObject
          : FALLBACK_LANGUAGES,
      );
      await loadTranslations(nextDevice.languageCode);
      setStatus('ready');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to bootstrap locale';
      console.warn('[Locale] bootstrap failed', err);
      setLanguages(FALLBACK_LANGUAGES);
      setError(message);
      setStatus('error');
    }
  }, [loadTranslations]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const setLanguage = useCallback(
    async (code: string) => {
      setApiLanguageCode(code);
      setLanguageCode(code);

      try {
        if (device?.uniqueId) {
          const updated = await updateDeviceLanguage({
            DeviceUniqueId: device.uniqueId,
            LanguageCode: code,
          });

          setDevice(prev =>
            prev
              ? {
                  ...prev,
                  languageCode: updated.LanguageCode,
                  cultureCode: updated.CultureCode ?? null,
                }
              : prev,
          );
          await loadTranslations(updated.LanguageCode);
          return;
        }

        await loadTranslations(code);
      } catch (err) {
        console.warn('[Locale] setLanguage failed, keeping local code', err);
      }
    },
    [device?.uniqueId, loadTranslations],
  );

  const bindUser = useCallback(
    async (userId: number) => {
      const info = await getDeviceLaunchInfo();
      const uniqueId = device?.uniqueId || info.uniqueId;
      if (!uniqueId) {
        return;
      }

      // Ensure a device row exists (e.g. after DB wipe while app stayed in memory).
      try {
        await bootstrapDevice({
          DeviceUniqueId: uniqueId,
          Platform: info.platform,
          OsVersion: info.osVersion,
          LanguageCode: device?.languageCode || info.language,
          CultureCode: device?.cultureCode || info.cultureCode,
          Theme: device?.theme || (info.colorScheme === 'dark' ? 'dark' : 'light'),
          PushToken: null,
        });
      } catch (bootstrapError) {
        console.warn('[Locale] bootstrap before bind failed', bootstrapError);
      }

      const bound = await bindDeviceUser({
        DeviceUniqueId: uniqueId,
        UserId: userId,
      });

      setDevice(prev =>
        prev
          ? {
              ...prev,
              uniqueId,
              userId: bound.UserId ?? userId,
            }
          : {
              id: bound.Id,
              uniqueId,
              languageCode: info.language.split(/[-_]/)[0] || 'en',
              cultureCode: info.cultureCode,
              theme: info.colorScheme === 'dark' ? 'dark' : 'light',
              userId: bound.UserId ?? userId,
              isNew: false,
            },
      );
    },
    [device],
  );

  const t = useCallback(
    (key: string, fallback?: string) =>
      translations[key] ?? fallback ?? FALLBACK_TRANSLATIONS[key] ?? key,
    [translations],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      status,
      error,
      languageCode,
      languages,
      translations,
      device,
      t,
      setLanguage,
      bindUser,
      refresh: bootstrap,
    }),
    [
      status,
      error,
      languageCode,
      languages,
      translations,
      device,
      t,
      setLanguage,
      bindUser,
      bootstrap,
    ],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used inside a <LocaleProvider />');
  }
  return ctx;
}
