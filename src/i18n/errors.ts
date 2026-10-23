import { ApiError } from '../api/client';
import { getApiLanguageCode } from '../api/languageHeader';

const ENGLISH_TO_KEY: Record<string, string> = {
  'Invalid email or password.': 'auth.invalid_credentials',
  'Username is required.': 'auth.username_required',
  'Username must be between 3 and 50 characters.': 'auth.username_length',
  'This username is already taken.': 'auth.username_taken',
  'This email is already registered.': 'auth.email_exists',
  'This email is already registered': 'auth.email_exists',
  'This email already registered.': 'auth.email_exists',
  'This email already registered': 'auth.email_exists',
  'Please select a gender.': 'auth.gender_required',
  'Invalid gender selection.': 'auth.gender_invalid',
  'Please choose a valid birth date.': 'auth.birth_date_invalid',
  'You must be at least 18.': 'auth.age_too_young',
  'Access denied. A valid token was not found.': 'auth.access_denied',
  'Password must be at least 8 characters.': 'auth.password_min',
  'Current password is incorrect.': 'auth.current_password_incorrect',
  'Current password is incorrect': 'auth.current_password_incorrect',
  'New password must be different from the current one.':
    'auth.password_same_as_current',
  'New password must be different from the current one':
    'auth.password_same_as_current',
  'Invalid or expired code. Try again.': 'auth.otp_invalid',
  'Something went wrong.': 'common.error_generic',
  'Something went wrong': 'common.error_generic',
  'Request failed': 'common.error_generic',
  'Login failed': 'auth.login_failed',
  'Network request failed': 'common.network_error',
  'Check your connection and try again.': 'common.network_error',
  'Could not reach the server. Try again in a moment.':
    'common.server_unreachable',
  'Could not reach the server. Try again in a moment':
    'common.server_unreachable',
  'Sunucuya ulaşılamıyor. Biraz sonra tekrar dene.':
    'common.server_unreachable',
  'Sunucuya ulaşılamıyor. Biraz sonra tekrar dene': 'common.server_unreachable',
  'User id is required.': 'common.user_id_required',
  'userId is required.': 'common.user_id_required',
  'User not found.': 'user.not_found',
  'User Not Found.': 'user.not_found',
  'Invalid user ids.': 'user.invalid_ids',
  'Bio cannot exceed 500 characters.': 'user.bio_too_long',
  'File is required.': 'media.file_required',
  'Photo not found.': 'photos.not_found',
  'Story not found.': 'stories.not_found',
  'Stories are only visible to friends.': 'stories.friends_only',
  'Friend request not found.': 'friends.request_not_found',
  'Friendship not found.': 'friends.not_found',
  'Friend request is not pending.': 'friends.request_not_pending',
  'Only the recipient can accept this request.':
    'friends.only_recipient_accept',
  'Only the recipient can reject this request.':
    'friends.only_recipient_reject',
  'Only the sender can cancel this request.': 'friends.only_sender_cancel',
  'Cannot send a friend request to yourself.': 'friends.cannot_self',
  'Already friends.': 'friends.already_friends',
  'Friend request already sent.': 'friends.request_already_sent',
  'This user already sent you a friend request.': 'friends.request_incoming',
  'Cannot like yourself.': 'likes.cannot_self',
  'Already liked.': 'likes.already_liked',
  'Like not found.': 'likes.not_found',
  'Likes are not available.': 'likes.retired',
  'Beğeni özelliği kullanılmıyor.': 'likes.retired',
  'Message body is required.': 'chat.body_required',
  'Conversation peer not found.': 'chat.peer_not_found',
  'Users must be friends to send messages.': 'chat.friends_only',
  'You must be friends to send messages.': 'chat.friends_only',
  'Mesaj göndermek için arkadaş olmalısınız.': 'chat.friends_only',
  'Users must be friends to start a conversation.': 'chat.start_friends_only',
  'You must be friends to start a conversation.': 'chat.start_friends_only',
  'Sohbet başlatmak için arkadaş olmalısınız.': 'chat.start_friends_only',
  'Conversation not found.': 'chat.conversation_not_found',
  'Message not found.': 'chat.message_not_found',
  'Message not found in this conversation.': 'chat.message_not_found',
  'Only the sender can delete this message.': 'chat.only_sender_delete',
  'You are not a participant of this conversation.': 'chat.not_participant',
  'Unauthorized.': 'chat.unauthorized',
  'Failed to send message.': 'chat.send_failed',
  'Failed to mark as read.': 'chat.mark_read_failed',
  'DeviceUniqueId is required.': 'device.id_required',
  'DeviceUniqueId and UserId are required.': 'device.id_user_required',
  'Device not found.': 'device.not_found',
  'Language not found.': 'language.not_found',
  'No active language found.': 'language.none_active',
  'Languages Not Found.': 'language.list_empty',
  'Languages not found.': 'language.list_empty',
  'Value cannot be empty.': 'interest.value_empty',
  'User interest not found.': 'interest.not_found',
  'Invalid plan_code. Use standard or plus.': 'premium.plan_invalid',
  'You cannot block yourself.': 'safety.cannot_block_self',
  'You cannot report yourself.': 'safety.cannot_report_self',
  'User blocked.': 'safety.blocked',
  'User unblocked.': 'safety.unblocked',
  'This user is not blocked.': 'safety.block_not_found',
  'Report sent. Thank you.': 'safety.reported',
  'Please choose a valid report reason.': 'safety.reason_invalid',
  'You cannot interact with this user.': 'safety.users_blocked',
  'Image picker failed': 'profile.photo_error',
  'Camera picker failed': 'stories.pick_error',
};

function looksLikeKey(value: string): boolean {
  return /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(value.trim());
}

function isTechnical(message: string): boolean {
  return (
    !message.trim() ||
    /^HTTP\s*\d{3}\b/i.test(message.trim()) ||
    /failed to fetch|network request failed|timeout/i.test(message)
  );
}

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ').replace(/[.!]+$/g, '');
}

function mapApiMessage(message: string): string | null {
  const trimmed = message.trim();
  if (ENGLISH_TO_KEY[trimmed]) {
    return ENGLISH_TO_KEY[trimmed];
  }
  const folded = normalizeMessage(trimmed);
  if (ENGLISH_TO_KEY[folded]) {
    return ENGLISH_TO_KEY[folded];
  }
  if (ENGLISH_TO_KEY[`${folded}.`]) {
    return ENGLISH_TO_KEY[`${folded}.`];
  }
  if (/this email already registered/i.test(folded)) {
    return 'auth.email_exists';
  }
  if (/^Maximum \d+ gallery photos allowed/i.test(trimmed)) {
    return 'photos.gallery_max';
  }
  if (/^Status cannot exceed \d+/i.test(trimmed)) {
    return 'user.status_too_long';
  }
  if (/^Caption max length is \d+/i.test(trimmed)) {
    return 'stories.caption_max';
  }
  if (
    /must be friends to send messages/i.test(folded) ||
    /mesaj göndermek için arkadaş/i.test(folded)
  ) {
    return 'chat.friends_only';
  }
  if (
    /must be friends to start a conversation/i.test(folded) ||
    /sohbet başlatmak için arkadaş/i.test(folded)
  ) {
    return 'chat.start_friends_only';
  }
  if (looksLikeKey(trimmed)) {
    return trimmed;
  }
  return null;
}

export function userFacingError(
  error: unknown,
  t: (key: string, fallback?: string) => string,
  fallbackKey = 'common.error_generic',
): string {
  if (error instanceof ApiError && error.status === 0) {
    return t('common.server_unreachable');
  }

  const raw =
    error instanceof ApiError
      ? error.messages[0] ?? error.message
      : error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '';

  if (raw) {
    const key = mapApiMessage(raw);
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        return translated;
      }
    }
    if (!isTechnical(raw)) {
      return raw;
    }
  }

  return t(fallbackKey);
}

export function isAccountGoneError(error: unknown): boolean {
  const messages =
    error instanceof ApiError
      ? error.messages
      : error instanceof Error
        ? [error.message]
        : typeof error === 'string'
          ? [error]
          : [];
  return messages.some(message => {
    const key = mapApiMessage(message);
    if (key === 'user.not_found') {
      return true;
    }
    return /user not found/i.test(message);
  });
}

export function localizedCrashCopy(languageCode = getApiLanguageCode()) {
  const code = languageCode.toLowerCase().split(/[-_]/)[0];
  if (code === 'tr') {
    return {
      title: 'Kısa bir bakımdayız',
      message:
        'Hesabın veya uygulama toparlanıyor. 1–2 dakikaya düzeltiliyor.',
      retry: 'Tekrar dene',
      leave: 'Girişe dön',
    };
  }
  if (code === 'ar') {
    return {
      title: 'سنعود بعد لحظات',
      message:
        'يجري استعادة حسابك أو التطبيق. يُفترض أن يُصلح ذلك خلال دقيقة أو دقيقتين.',
      retry: 'حاول مرة أخرى',
      leave: 'العودة لتسجيل الدخول',
    };
  }
  if (code === 'ru') {
    return {
      title: 'Скоро вернёмся',
      message:
        'Аккаунт или приложение восстанавливаются. Обычно это занимает 1–2 минуты.',
      retry: 'Повторить',
      leave: 'Вернуться ко входу',
    };
  }
  return {
    title: 'We’ll be right back',
    message:
      'Your account or the app is being restored. This should be fixed in 1–2 minutes.',
    retry: 'Try again',
    leave: 'Back to sign in',
  };
}
