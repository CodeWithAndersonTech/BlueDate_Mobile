import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  getInterestTypes,
  getUserProfile,
  InterestTypeItem,
  parseInterestTypes,
  deleteUserInterest,
  resolveMediaUrl,
  saveUserInterest,
  updateUserBasics,
  updateUserBio,
} from '../../api';
import {
  BirthDatePicker,
  Chip,
  FigmaButton,
  FigmaIcon,
  BottomActionDock,
  FigmaSpinner,
  Icon,
  SheetModal,
  Typography,
  useScreenTopPad,
} from '../../components';
import { useKeyboardHeight } from '../../hooks';
import { interestTypeLabel, useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { ProfileStackParamList } from '../../navigation/types';
import {
  assetFromPickerResponse,
  pickPhotoFromLibrary,
} from '../../services/photos/pickImage';
import {
  MAX_GALLERY_PHOTOS,
  PhotoLimitError,
  loadProfilePhotos,
  mergeAvatarIntoDisplayPhotos,
  mergePhotoLists,
  photosFromProfile,
  pickAndAddGalleryPhoto,
  ProfilePhoto,
  rememberAvatar,
  removeGalleryPhoto,
} from '../../services/photos/photoStore';
import { useTheme } from '../../theme';
import {
  BirthParts,
  clampDay,
  defaultBirthParts,
  formatBirthDateIso,
  isValidRegisterAge,
} from '../../utils/birthDate';
import { GENDER_OPTIONS, isValidGender } from '../../utils/gender';
import { EditProfileSkeleton } from './EditProfileSkeleton';
import { PhotoViewerModal } from './PhotoViewerModal';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const PHOTO_TILE_W = 149;
const PHOTO_TILE_H = 173;
const PHOTO_GAP = 5;
const PHOTO_STRIDE = PHOTO_TILE_W + PHOTO_GAP;
const GRID_GAP = 5;
const GRID_INSET = 16;
const GRID_COLS = 3;
const SAVED_FEEDBACK_MS = 2400;
const BIO_MAX = 300;

const INTEREST_EMOJI: { match: RegExp; emoji: string }[] = [
  { match: /food|yemek|yeme/i, emoji: '🍽' },
  { match: /dessert|tatlı|tatl/i, emoji: '🍰' },
  { match: /coffee|kahve/i, emoji: '☕' },
  { match: /drink|beverage|alcohol|alkol|içecek|icecek/i, emoji: '🥤' },
  { match: /music|müzik|muzik/i, emoji: '🎵' },
  { match: /travel|gezi|seyahat/i, emoji: '✈' },
  { match: /fitness|sport|spor/i, emoji: '🏋' },
  { match: /game|oyun/i, emoji: '🎮' },
  { match: /book|kitap/i, emoji: '📚' },
  { match: /movie|film|sinema/i, emoji: '🎬' },
  { match: /art|sanat/i, emoji: '🎨' },
  { match: /nature|doğa|doga/i, emoji: '🌿' },
];

function interestEmoji(type: InterestTypeItem): string {
  const hay = `${type.Code ?? ''} ${type.Name ?? ''} ${type.KeyName ?? ''}`;
  for (const item of INTEREST_EMOJI) {
    if (item.match.test(hay)) return item.emoji;
  }
  return '✨';
}

function dateKey(iso?: string | null): string {
  const match = iso?.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}

function partsFromIso(iso?: string | null): BirthParts {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return defaultBirthParts();
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return { year, month, day: clampDay(year, month, day) };
}

function normalizeUsername(value: string): string {
  return value.replace(/^@/, '').replace(/\s/g, '').toLowerCase();
}

export function EditProfileScreen({ navigation, route }: Props) {
  useLockTabSwipe();

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = useScreenTopPad();
  const { userId, accessToken } = useAuth();
  const { t } = useLocale();
  const focusTarget = route.params?.focus;
  const focusInterestTypeId = route.params?.interestTypeId;

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [initialFirstName, setInitialFirstName] = useState('');
  const [initialLastName, setInitialLastName] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialBio, setInitialBio] = useState('');
  const [birthParts, setBirthParts] = useState<BirthParts>(defaultBirthParts);
  const [initialBirthDate, setInitialBirthDate] = useState('');
  const [gender, setGender] = useState<number | null>(null);
  const [initialGender, setInitialGender] = useState<number | null>(null);
  const [birthSheetOpen, setBirthSheetOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [photoPage, setPhotoPage] = useState(0);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [initialAnswers, setInitialAnswers] = useState<Record<number, string>>(
    {},
  );
  /** InterestTypeId → mevcut UserInterest entity Id (silme için). */
  const [interestIds, setInterestIds] = useState<Record<number, number>>({});
  const [sheetType, setSheetType] = useState<InterestTypeItem | null>(null);
  const [sheetValue, setSheetValue] = useState('');
  const [bioFocused, setBioFocused] = useState(false);
  const [interestsHighlighted, setInterestsHighlighted] = useState(false);
  const contentOpacity = useSharedValue(0);
  const hasLoadedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const bioInputRef = useRef<TextInput>(null);
  const bioOffsetY = useRef(0);
  const interestsOffsetY = useRef(0);
  const focusAppliedKey = useRef<string | null>(null);
  const focusTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** User dismissed the auto-opened interest sheet for this focus key. */
  const interestFocusDismissedKey = useRef<string | null>(null);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoIdsOnEditorOpen = useRef<string[]>([]);

  const clearFocusTimers = useCallback(() => {
    focusTimersRef.current.forEach(clearTimeout);
    focusTimersRef.current = [];
  }, []);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const dirty = useMemo(() => {
    if (firstName.trim() !== initialFirstName.trim()) return true;
    if (lastName.trim() !== initialLastName.trim()) return true;
    if (normalizeUsername(username) !== normalizeUsername(initialUsername)) {
      return true;
    }
    if (formatBirthDateIso(birthParts) !== initialBirthDate) return true;
    if (gender !== initialGender) return true;
    if (bio.trim() !== initialBio.trim()) return true;
    const keys = new Set([
      ...Object.keys(answers),
      ...Object.keys(initialAnswers),
    ]);
    for (const key of keys) {
      const id = Number(key);
      if ((answers[id] ?? '').trim() !== (initialAnswers[id] ?? '').trim()) {
        return true;
      }
    }
    return false;
  }, [
    answers,
    initialAnswers,
    bio,
    initialBio,
    firstName,
    lastName,
    username,
    initialFirstName,
    initialLastName,
    initialUsername,
    birthParts,
    initialBirthDate,
    gender,
    initialGender,
  ]);

  const goBackToProfile = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('ProfileMain');
  }, [navigation]);

  const closeInterestSheet = useCallback(() => {
    clearFocusTimers();
    if (focusTarget === 'interests') {
      interestFocusDismissedKey.current = `${focusTarget}:${
        focusInterestTypeId ?? ''
      }`;
    }
    setSheetType(prev => {
      // Only dismiss keyboard when an interest sheet was actually open —
      // otherwise bio/other inputs lose focus immediately after gaining it.
      if (prev != null) {
        Keyboard.dismiss();
      }
      return null;
    });
  }, [clearFocusTimers, focusTarget, focusInterestTypeId]);

  const openPhotoEditor = useCallback(() => {
    photoIdsOnEditorOpen.current = photos.map(photo => photo.id);
    setPhotoEditorOpen(true);
  }, [photos]);

  const addedEditorPhotos = useCallback(() => {
    const known = new Set(photoIdsOnEditorOpen.current);
    return photos.filter(photo => !known.has(photo.id));
  }, [photos]);

  const discardAddedEditorPhotos = useCallback(async () => {
    const added = addedEditorPhotos();
    if (!userId || added.length === 0) {
      setPhotoEditorOpen(false);
      return;
    }
    setPhotoBusy(true);
    try {
      await Promise.all(
        added.map(photo =>
          removeGalleryPhoto(userId, photo, accessToken).catch(() => undefined),
        ),
      );
      const keep = new Set(photoIdsOnEditorOpen.current);
      setPhotos(prev => prev.filter(photo => keep.has(photo.id)));
    } finally {
      setPhotoBusy(false);
      setPhotoEditorOpen(false);
    }
  }, [addedEditorPhotos, userId, accessToken]);

  const requestClosePhotoEditor = useCallback(() => {
    if (photoBusy || saving) {
      return;
    }
    const added = addedEditorPhotos();
    if (added.length === 0) {
      setPhotoEditorOpen(false);
      return;
    }
    Alert.alert(t('edit.photos_unsaved_title'), t('edit.photos_unsaved_message'), [
      {
        text: t('edit.photos_unsaved_discard'),
        style: 'destructive',
        onPress: () => {
          void discardAddedEditorPhotos();
        },
      },
      {
        text: t('edit.photos_unsaved_keep'),
        onPress: () => setPhotoEditorOpen(false),
      },
    ]);
  }, [
    photoBusy,
    saving,
    addedEditorPhotos,
    discardAddedEditorPhotos,
    t,
  ]);

  const requestClose = useCallback(() => {
    if (saving) {
      return;
    }
    // Overlays first — don't leave the screen while they're open.
    if (sheetType != null) {
      closeInterestSheet();
      return;
    }
    if (photoEditorOpen) {
      requestClosePhotoEditor();
      return;
    }
    if (dirty) {
      Alert.alert(t('edit.discard_title'), t('edit.discard_message'), [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('edit.discard_confirm'),
          style: 'destructive',
          onPress: goBackToProfile,
        },
      ]);
      return;
    }
    goBackToProfile();
  }, [
    saving,
    sheetType,
    photoEditorOpen,
    dirty,
    t,
    goBackToProfile,
    closeInterestSheet,
    requestClosePhotoEditor,
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });
    return () => sub.remove();
  }, [requestClose]);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    const showSkeleton = !hasLoadedRef.current;
    if (showSkeleton) {
      setLoading(true);
    }
    setLoadFailed(false);
    try {
      const [profile, typesResponse] = await Promise.all([
        getUserProfile(userId, accessToken),
        getInterestTypes(accessToken).catch(() => null),
      ]);
      const nextFirst = profile.FirstName ?? '';
      const nextLast = profile.LastName ?? '';
      const nextUser = profile.Username ?? '';
      setFirstName(nextFirst);
      setLastName(nextLast);
      setUsername(nextUser);
      setInitialFirstName(nextFirst);
      setInitialLastName(nextLast);
      setInitialUsername(nextUser);
      const nextBio = profile.Bio?.trim() ?? '';
      setBio(nextBio);
      setInitialBio(nextBio);
      const nextBirth = dateKey(profile.BirthDate);
      setBirthParts(partsFromIso(profile.BirthDate));
      setInitialBirthDate(nextBirth);
      const nextGender = isValidGender(profile.Gender) ? profile.Gender : null;
      setGender(nextGender);
      setInitialGender(nextGender);
      setSaveError(null);

      let types = parseInterestTypes(typesResponse);
      if (types.length === 0) {
        const seen = new Set<number>();
        types = (profile.Interests ?? []).flatMap(item => {
          const id = Number(item.InterestTypeId);
          if (!id || seen.has(id)) {
            return [];
          }
          seen.add(id);
          return [
            {
              Id: id,
              Code: item.InterestTypeCode ?? '',
              Name: item.InterestTypeName ?? item.InterestTypeCode ?? '',
              SortOrder: seen.size,
            },
          ];
        });
      }
      setInterestTypes(types);

      const nextAnswers: Record<number, string> = {};
      const nextIds: Record<number, number> = {};
      types.forEach(type => {
        const existing = profile.Interests?.find(
          item => Number(item.InterestTypeId) === Number(type.Id),
        );
        nextAnswers[type.Id] = existing?.Value?.trim() ?? '';
        if (existing?.Id != null) {
          nextIds[type.Id] = existing.Id;
        }
      });
      setAnswers(nextAnswers);
      setInitialAnswers({ ...nextAnswers });
      setInterestIds(nextIds);

      try {
        const [bundle, fromProfile] = await Promise.all([
          loadProfilePhotos(userId, accessToken),
          photosFromProfile(profile.Photos),
        ]);
        const profileAvatar = await resolveMediaUrl(profile.ProfileImage).catch(
          () => undefined,
        );
        setPhotos(
          mergeAvatarIntoDisplayPhotos({
            avatarUri: bundle.avatarUri ?? profileAvatar,
            avatar: bundle.avatar,
            gallery: mergePhotoLists(fromProfile, bundle.gallery),
          }),
        );
      } catch {
        const fromProfile = await photosFromProfile(profile.Photos).catch(() => []);
        setPhotos(fromProfile);
      }
      hasLoadedRef.current = true;
      setLoadFailed(false);
    } catch {
      if (!hasLoadedRef.current) {
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        clearFocusTimers();
        focusAppliedKey.current = null;
        interestFocusDismissedKey.current = null;
        setBioFocused(false);
        setInterestsHighlighted(false);
        setSheetType(null);
      };
    }, [load, clearFocusTimers]),
  );

  useEffect(() => {
    if (!loading && hasLoadedRef.current && !loadFailed) {
      contentOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    } else if (loading) {
      contentOpacity.value = 0;
    }
  }, [loading, loadFailed, contentOpacity]);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const openInterestSheet = useCallback(
    (type: InterestTypeItem) => {
      setSheetType(type);
      setSheetValue(answers[type.Id] ?? '');
    },
    [answers],
  );

  useEffect(() => {
    if (loading || loadFailed || !focusTarget) {
      return;
    }

    const key = `${focusTarget}:${focusInterestTypeId ?? ''}`;
    if (focusAppliedKey.current === key) {
      return;
    }
    focusAppliedKey.current = key;
    clearFocusTimers();

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      focusTimersRef.current.push(id);
    };

    schedule(() => {
      if (focusTarget === 'bio') {
        scrollRef.current?.scrollTo({
          y: Math.max(0, bioOffsetY.current - 20),
          animated: true,
        });
        setBioFocused(true);
        schedule(() => bioInputRef.current?.focus(), 280);
        return;
      }

      if (focusTarget === 'interests') {
        scrollRef.current?.scrollTo({
          y: Math.max(0, interestsOffsetY.current - 20),
          animated: true,
        });
        setInterestsHighlighted(true);
        schedule(() => setInterestsHighlighted(false), 1600);

        if (interestFocusDismissedKey.current === key) {
          return;
        }

        const targetType =
          focusInterestTypeId != null
            ? interestTypes.find(
                type => Number(type.Id) === Number(focusInterestTypeId),
              )
            : interestTypes[0];
        if (targetType) {
          schedule(() => {
            if (interestFocusDismissedKey.current === key) {
              return;
            }
            openInterestSheet(targetType);
          }, 320);
        }
      }
    }, 120);

    return () => clearFocusTimers();
  }, [
    loading,
    loadFailed,
    focusTarget,
    focusInterestTypeId,
    interestTypes,
    openInterestSheet,
    clearFocusTimers,
  ]);

  const applyInterestSheet = () => {
    if (!sheetType) return;
    setAnswers(prev => ({ ...prev, [sheetType.Id]: sheetValue.trim() }));
    closeInterestSheet();
  };

  const clearInterestSheet = () => {
    if (!sheetType) return;
    setAnswers(prev => ({ ...prev, [sheetType.Id]: '' }));
    closeInterestSheet();
  };

  const onPhotoRailScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / PHOTO_STRIDE);
    setPhotoPage(Math.max(0, page));
  };

  const pickGalleryAsset = async () => {
    const result = await pickPhotoFromLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) return null;
    if (result.errorCode === 'permission') {
      Alert.alert(t('profile.photos'), t('profile.photo_permission'));
      return null;
    }
    if (result.errorMessage === 'NATIVE_MODULE_MISSING') {
      Alert.alert(t('profile.photos'), t('profile.photo_native_missing'));
      return null;
    }
    if (result.errorCode) {
      Alert.alert(t('profile.photos'), t('profile.photo_error'));
      return null;
    }
    const asset = assetFromPickerResponse(result);
    if (!asset) {
      Alert.alert(t('profile.photos'), t('profile.photo_error'));
      return null;
    }
    return asset;
  };

  const addGalleryPhoto = async () => {
    if (!userId || photoBusy) return;
    if (photos.length >= MAX_GALLERY_PHOTOS) {
      Alert.alert(
        t('profile.photos'),
        t('profile.photos_max').replace('{count}', String(MAX_GALLERY_PHOTOS)),
      );
      return;
    }
    const asset = await pickGalleryAsset();
    if (!asset) return;
    setPhotoBusy(true);
    try {
      const photo = await pickAndAddGalleryPhoto(userId, asset, accessToken);
      setPhotos(prev => [...prev, photo]);
    } catch (error) {
      if (error instanceof PhotoLimitError) {
        Alert.alert(
          t('profile.photos'),
          t('profile.photos_max').replace('{count}', String(MAX_GALLERY_PHOTOS)),
        );
      } else {
        Alert.alert(t('profile.photos'), t('profile.photo_error'));
      }
    } finally {
      setPhotoBusy(false);
    }
  };

  const deleteGalleryPhoto = (photo: ProfilePhoto) => {
    if (!userId || photoBusy) return;
    Alert.alert(t('profile.delete_photo'), t('profile.delete_photo_confirm'), [
      { text: t('common.close'), style: 'cancel' },
      {
        text: t('profile.delete_photo'),
        style: 'destructive',
        onPress: async () => {
          setPhotoBusy(true);
          try {
            await removeGalleryPhoto(userId, photo, accessToken);
            setPhotos(prev => {
              const next = prev.filter(item => item.id !== photo.id);
              if (next[0]?.uri) {
                rememberAvatar(userId, next[0].uri);
              }
              if (next.length === 0) {
                setViewerIndex(null);
              } else {
                setViewerIndex(index =>
                  index == null ? null : Math.min(index, next.length - 1),
                );
              }
              return next;
            });
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);
  };

  const onSave = async () => {
    if (!userId) {
      setSaveError(t('edit.session_missing'));
      return;
    }
    if (!dirty) {
      return;
    }

    const nextFirst = firstName.trim();
    const nextLast = lastName.trim();
    const nextUser = normalizeUsername(username);
    const nextBirth = formatBirthDateIso(birthParts);

    if (!nextFirst) {
      setSaveError(t('edit.first_name_required'));
      return;
    }
    if (!nextLast) {
      setSaveError(t('edit.last_name_required'));
      return;
    }
    if (nextUser.length < 3 || nextUser.length > 50) {
      setSaveError(t('auth.username_length'));
      return;
    }
    if (!isValidGender(gender)) {
      setSaveError(t('auth.gender_required'));
      return;
    }
    if (!isValidRegisterAge(birthParts)) {
      setSaveError(t('auth.age_too_young'));
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const nextBio = bio.trim();
      const tasks: Promise<unknown>[] = [];
      const nextIds = { ...interestIds };

      const basicsChanged =
        nextFirst !== initialFirstName.trim() ||
        nextLast !== initialLastName.trim() ||
        nextUser !== normalizeUsername(initialUsername) ||
        nextBirth !== initialBirthDate ||
        gender !== initialGender;
      if (basicsChanged) {
        tasks.push(
          updateUserBasics(
            {
              UserId: userId,
              FirstName: nextFirst,
              LastName: nextLast,
              Username: nextUser,
              BirthDate: `${nextBirth}T00:00:00.000Z`,
              Gender: gender,
            },
            accessToken,
          ),
        );
      }

      if (nextBio !== initialBio.trim()) {
        tasks.push(
          updateUserBio({ UserId: userId, Bio: nextBio }, accessToken),
        );
      }

      for (const type of interestTypes) {
        const value = (answers[type.Id] ?? '').trim();
        const previous = (initialAnswers[type.Id] ?? '').trim();
        if (value === previous) {
          continue;
        }

        if (value.length > 0) {
          tasks.push(
            saveUserInterest(
              {
                UserId: userId,
                InterestTypeId: type.Id,
                Value: value,
              },
              accessToken,
            ).then(res => {
              if (res?.Id != null) {
                nextIds[type.Id] = res.Id;
              }
            }),
          );
        } else {
          const entityId = interestIds[type.Id];
          if (entityId != null) {
            tasks.push(
              deleteUserInterest(entityId, accessToken).then(() => {
                delete nextIds[type.Id];
              }),
            );
          }
        }
      }

      await Promise.all(tasks);
      setInitialFirstName(nextFirst);
      setInitialLastName(nextLast);
      setInitialUsername(nextUser);
      setInitialBirthDate(nextBirth);
      setInitialGender(gender);
      setFirstName(nextFirst);
      setLastName(nextLast);
      setUsername(nextUser);
      setInitialBio(nextBio);
      setInitialAnswers({ ...answers });
      setInterestIds(nextIds);
      setSaving(false);
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), SAVED_FEEDBACK_MS);
    } catch (error) {
      setSaving(false);
      setSaveError(userFacingError(error, t, 'edit.save_error_desc'));
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, paddingTop: topPad },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.header}>
        <Pressable
          onPress={requestClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}>
          <View style={styles.backIcon}>
            <FigmaIcon name="arrowRight" size={15} color={theme.colors.text} />
          </View>
        </Pressable>
        <Typography variant="title" style={styles.headerTitle}>
          {t('edit.title')}
        </Typography>
        <Pressable
          onPress={load}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('profile.retry')}>
          <FigmaIcon name="rotateRight" size={24} />
        </Pressable>
      </View>

      {loading ? (
        <EditProfileSkeleton />
      ) : loadFailed ? (
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            {t('edit.load_error_title')}
          </Text>
          <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
            {userId ? t('edit.load_error_desc') : t('edit.session_missing')}
          </Text>
          {userId ? (
            <FigmaButton
              label={t('profile.retry')}
              size="md"
              onPress={load}
            />
          ) : null}
        </View>
      ) : (
        <Animated.View style={[styles.body, contentFadeStyle]}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 24 },
            ]}>
            <View
              style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.cardHead}>
                <Icon
                  name="user"
                  size={theme.iconSize.md}
                  color={theme.colors.plusCta}
                />
                <Typography variant="callout" weight="600">
                  {t('edit.basics')}
                </Typography>
              </View>
              <FieldRow label={t('edit.first_name')}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder={t('edit.first_name')}
                  placeholderTextColor={theme.colors.textMuted}
                  accessibilityLabel={t('edit.first_name')}
                  style={[
                    styles.infoInput,
                    theme.typography.variants.callout,
                    { color: theme.colors.text },
                  ]}
                />
              </FieldRow>
              <FieldRow label={t('edit.last_name')}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder={t('edit.last_name')}
                  placeholderTextColor={theme.colors.textMuted}
                  accessibilityLabel={t('edit.last_name')}
                  style={[
                    styles.infoInput,
                    theme.typography.variants.callout,
                    { color: theme.colors.text },
                  ]}
                />
              </FieldRow>
              <FieldRow label={t('edit.username')}>
                <TextInput
                  value={username}
                  onChangeText={text => setUsername(normalizeUsername(text))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  placeholder={t('edit.username')}
                  placeholderTextColor={theme.colors.textMuted}
                  accessibilityLabel={t('edit.username')}
                  style={[
                    styles.infoInput,
                    theme.typography.variants.callout,
                    { color: theme.colors.text },
                  ]}
                />
              </FieldRow>
              <FieldRow label={t('edit.birth_date')}>
                <Pressable
                  onPress={() => setBirthSheetOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('edit.birth_date')}
                  style={styles.infoValue}>
                  <Typography variant="callout">
                    {`${String(birthParts.day).padStart(2, '0')}.${String(birthParts.month).padStart(2, '0')}.${birthParts.year}`}
                  </Typography>
                </Pressable>
              </FieldRow>
              <FieldRow label={t('edit.gender')}>
                <View style={styles.genderRow}>
                  {GENDER_OPTIONS.map(option => (
                    <Chip
                      key={option.value}
                      label={t(option.labelKey)}
                      selected={gender === option.value}
                      onPress={() => setGender(option.value)}
                      style={styles.genderChip}
                    />
                  ))}
                </View>
              </FieldRow>
              <View
                onLayout={e => {
                  bioOffsetY.current = e.nativeEvent.layout.y;
                }}
                style={styles.aboutRow}>
                <Typography
                  variant="caption"
                  color="textMuted"
                  style={styles.infoLabel}
                  numberOfLines={1}>
                  {t('edit.about')}
                </Typography>
                <Typography variant="callout" color="textMuted">
                  :
                </Typography>
                <TextInput
                  ref={bioInputRef}
                  value={bio}
                  onChangeText={text =>
                    setBio(text.length <= BIO_MAX ? text : text.slice(0, BIO_MAX))
                  }
                  onFocus={() => {
                    if (sheetType != null) {
                      closeInterestSheet();
                    }
                    setBioFocused(true);
                  }}
                  onBlur={() => setBioFocused(false)}
                  multiline
                  placeholder={t('profile.add_bio_desc')}
                  placeholderTextColor={theme.colors.textMuted}
                  accessibilityLabel={t('edit.about')}
                  style={[
                    styles.aboutInput,
                    theme.typography.variants.callout,
                    {
                      color: theme.colors.text,
                      borderColor: bioFocused
                        ? theme.colors.plusCta
                        : 'transparent',
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.cardHead}>
                <Icon
                  name="camera"
                  size={theme.iconSize.md}
                  color={theme.colors.plusCta}
                />
                <Typography variant="callout" weight="600" style={styles.flex}>
                  {t('profile.photos')}
                </Typography>
                <FigmaButton
                  label={t('edit.edit_photo')}
                  tone="soft"
                  size="compact"
                  onPress={openPhotoEditor}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={PHOTO_STRIDE}
                snapToAlignment="start"
                onScroll={onPhotoRailScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.photoRail}>
                {photos.length === 0 ? (
                  <Pressable
                    onPress={addGalleryPhoto}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.add_photo')}
                    style={[
                      styles.photoTile,
                      { backgroundColor: theme.colors.surfaceAlt },
                    ]}>
                    <Icon
                      name="plus"
                      size={theme.iconSize.lg}
                      color={theme.colors.plusCta}
                    />
                    <Typography variant="caption" color="textMuted">
                      {t('profile.add_photo')}
                    </Typography>
                  </Pressable>
                ) : (
                  photos.map((photo, index) => (
                    <Pressable
                      key={photo.id}
                      onPress={() => setViewerIndex(index)}
                      accessibilityRole="imagebutton"
                      style={[
                        styles.photoTile,
                        { backgroundColor: theme.colors.surfaceAlt },
                      ]}>
                      <Image
                        source={{ uri: photo.uri }}
                        fadeDuration={0}
                        style={styles.fill}
                      />
                    </Pressable>
                  ))
                )}
              </ScrollView>
              {photos.length > 1 ? (
                <View style={styles.dots}>
                  {photos.map((photo, index) => {
                    const active = index === photoPage;
                    return (
                      <View
                        key={photo.id}
                        style={[
                          styles.dot,
                          active ? styles.dotActive : styles.dotIdle,
                          {
                            backgroundColor: active
                              ? theme.colors.plusCta
                              : theme.colors.border,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ) : null}
            </View>

            <View
              onLayout={e => {
                interestsOffsetY.current = e.nativeEvent.layout.y;
              }}
              style={[
                styles.card,
                { backgroundColor: theme.colors.card },
                interestsHighlighted
                  ? { borderWidth: 1, borderColor: theme.colors.plusCta }
                  : null,
              ]}>
              <View style={styles.cardHead}>
                <Icon
                  name="heart"
                  size={theme.iconSize.md}
                  color={theme.colors.plusCta}
                />
                <Typography variant="callout" weight="600">
                  {t('edit.favorites')}
                </Typography>
              </View>
              {interestTypes.length === 0 ? (
                <Typography variant="caption" color="textMuted">
                  {t('edit.no_interest_types')}
                </Typography>
              ) : (
                interestTypes.map(type => {
                  const value = (answers[type.Id] ?? '').trim();
                  return (
                    <FavoriteRow
                      key={type.Id}
                      emoji={interestEmoji(type)}
                      title={interestTypeLabel(t, type)}
                      value={value}
                      addLabel={t('edit.add_interest')}
                      changeLabel={t('edit.change')}
                      onPress={() => openInterestSheet(type)}
                    />
                  );
                })
              )}
            </View>
          </ScrollView>
          {sheetType == null && !photoEditorOpen ? (
            <BottomActionDock forceAboveTabBar elevated direction="column">
              {saveError ? (
                <Typography variant="caption" tint={theme.colors.danger}>
                  {saveError}
                </Typography>
              ) : null}
              <FigmaButton
                label={
                  saving
                    ? t('edit.saving')
                    : justSaved
                      ? t('edit.saved')
                      : t('edit.save_changes')
                }
                size="md"
                fullWidth
                tone={justSaved || dirty ? 'solid' : 'soft'}
                loading={saving}
                onPress={dirty && !justSaved ? onSave : undefined}
              />
            </BottomActionDock>
          ) : null}
        </Animated.View>
      )}

      {saving ? (
        <View
          pointerEvents="auto"
          style={[styles.saveOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.saveCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            <FigmaSpinner size={28} />
            <Typography variant="callout" weight="600">
              {t('edit.saving')}
            </Typography>
          </View>
        </View>
      ) : null}

      <SheetModal
        visible={birthSheetOpen}
        title={t('edit.birth_date')}
        onClose={() => setBirthSheetOpen(false)}>
        <BirthDatePicker
          value={birthParts}
          onChange={setBirthParts}
          hint={t('auth.birth_date_hint')}
        />
        <FigmaButton
          label={t('edit.apply_interest')}
          size="md"
          fullWidth
          onPress={() => setBirthSheetOpen(false)}
        />
      </SheetModal>

      {justSaved ? (
        <View pointerEvents="none" style={[styles.toastHost, { top: topPad }]}>
          <View
            style={[
              styles.toast,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.black,
              },
            ]}>
            <FigmaIcon
              name="tickCircle"
              size={22}
              color={theme.colors.success}
            />
            <Typography variant="callout" weight="600">
              {t('edit.saved')}
            </Typography>
          </View>
        </View>
      ) : null}

      <InterestSheet
        visible={sheetType != null}
        emoji={sheetType ? interestEmoji(sheetType) : '✨'}
        title={sheetType ? interestTypeLabel(t, sheetType) : ''}
        value={sheetValue}
        onChange={setSheetValue}
        onClose={closeInterestSheet}
        onApply={applyInterestSheet}
        onClear={clearInterestSheet}
        hasValue={(answers[sheetType?.Id ?? -1] ?? '').trim().length > 0}
      />

      <PhotoEditorModal
        visible={photoEditorOpen}
        photos={photos}
        busy={photoBusy}
        onClose={requestClosePhotoEditor}
        onAdd={addGalleryPhoto}
        onOpenPhoto={index => {
          setPhotoEditorOpen(false);
          setViewerIndex(index);
        }}
      />

      <PhotoViewerModal
        photos={photos}
        index={viewerIndex ?? -1}
        editable
        busy={photoBusy}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
        onDelete={deleteGalleryPhoto}
      />
    </View>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <Typography
        variant="caption"
        color="textMuted"
        style={styles.infoLabel}
        numberOfLines={1}>
        {label}
      </Typography>
      <Typography variant="callout" color="textMuted">
        :
      </Typography>
      {children}
    </View>
  );
}

function FavoriteRow({
  emoji,
  title,
  value,
  addLabel,
  changeLabel,
  onPress,
}: {
  emoji: string;
  title: string;
  value: string;
  addLabel: string;
  changeLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const filled = value.length > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${filled ? value : addLabel}`}
      style={styles.favRow}>
      <View
        style={[styles.favIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
        <Text style={styles.favEmoji}>{emoji}</Text>
      </View>
      <View style={styles.favText}>
        <Typography variant="caption" color="textMuted" numberOfLines={1}>
          {title}
        </Typography>
        <Typography
          variant="callout"
          color={filled ? 'text' : 'textMuted'}
          numberOfLines={1}>
          {filled ? value : addLabel}
        </Typography>
      </View>
      <FigmaButton label={changeLabel} tone="soft" />
    </Pressable>
  );
}

function PhotoEditorModal({
  visible,
  photos,
  busy,
  onClose,
  onAdd,
  onOpenPhoto,
}: {
  visible: boolean;
  photos: ProfilePhoto[];
  busy: boolean;
  onClose: () => void;
  onAdd: () => void;
  onOpenPhoto: (index: number) => void;
}) {
  const theme = useTheme();
  const { t } = useLocale();
  const topPad = useScreenTopPad();
  const atLimit = photos.length >= MAX_GALLERY_PHOTOS;
  const tile = useMemo(() => {
    const width = Dimensions.get('window').width - GRID_INSET * 2;
    return (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
  }, []);
  const cells: Array<ProfilePhoto | 'add'> = [...photos];
  if (!atLimit) {
    cells.push('add');
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          { backgroundColor: theme.colors.background, paddingTop: topPad },
        ]}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}>
            <View style={styles.backIcon}>
              <FigmaIcon name="arrowRight" size={15} color={theme.colors.text} />
            </View>
          </Pressable>
          <Typography variant="title" style={styles.headerTitle}>
            {t('profile.photos')}
          </Typography>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
            {cells.map((item, index) => {
              if (item === 'add') {
                return (
                  <Pressable
                    key="add"
                    onPress={onAdd}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.add_photo')}
                    style={[
                      styles.gridTile,
                      {
                        width: tile,
                        height: tile,
                        backgroundColor: theme.colors.surfaceAlt,
                      },
                    ]}>
                    {busy ? (
                      <FigmaSpinner />
                    ) : (
                      <Icon
                        name="plus"
                        size={theme.iconSize.lg}
                        color={theme.colors.plusCta}
                      />
                    )}
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onOpenPhoto(index)}
                  accessibilityRole="imagebutton"
                  style={[
                    styles.gridTile,
                    { width: tile, height: tile, backgroundColor: theme.colors.surfaceAlt },
                  ]}>
                  <Image
                    source={{ uri: item.uri }}
                    fadeDuration={0}
                    style={styles.fill}
                  />
                </Pressable>
              );
            })}
          </View>
          {atLimit ? (
            <Typography variant="caption" color="textMuted" align="center">
              {t('profile.photos_max').replace(
                '{count}',
                String(MAX_GALLERY_PHOTOS),
              )}
            </Typography>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function InterestSheet({
  visible,
  emoji,
  title,
  value,
  onChange,
  onClose,
  onApply,
  onClear,
  hasValue,
}: {
  visible: boolean;
  emoji: string;
  title: string;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  hasValue: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { t } = useLocale();
  const showClear = hasValue || value.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View
        style={[
          styles.sheetModalRoot,
          { paddingBottom: keyboardHeight },
        ]}>
        <View style={styles.sheetModalBody}>
          <Pressable
            style={[
              styles.backdrop,
              { backgroundColor: theme.colors.backdrop },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.card,
                paddingBottom:
                  keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 16),
                borderBottomLeftRadius: keyboardHeight > 0 ? 0 : 24,
                borderBottomRightRadius: keyboardHeight > 0 ? 0 : 24,
              },
            ]}>
            <View style={styles.sheetBar}>
              <FigmaButton
                label={t('settings.cancel')}
                tone="muted"
                onPress={onClose}
              />
              <View style={styles.sheetTitleWrap}>
                <Text style={styles.sheetEmojiInline}>{emoji}</Text>
                <Typography variant="title" numberOfLines={1}>
                  {title}
                </Typography>
              </View>
              <FigmaButton
                label={t('edit.save')}
                tone="text"
                onPress={onApply}
              />
            </View>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={t('edit.answer_placeholder').replace(
                '{name}',
                title,
              )}
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onApply}
              accessibilityLabel={title}
              style={[
                styles.sheetInput,
                theme.typography.variants.callout,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceAlt,
                },
              ]}
            />
            {showClear ? (
              <Pressable
                onPress={onClear}
                hitSlop={8}
                style={styles.sheetClear}>
                <Typography variant="caption" color="danger">
                  {t('edit.clear_interest')}
                </Typography>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetModalRoot: {
    flex: 1,
  },
  sheetModalBody: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  content: {
    paddingHorizontal: 10,
    paddingTop: 4,
    gap: 10,
  },
  stickyDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  card: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    gap: 6,
  },
  infoLabel: {
    width: 100,
  },
  infoValue: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
  },
  infoInput: {
    flex: 1,
    minHeight: 32,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  genderRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
  },
  genderChip: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minHeight: 44,
  },
  aboutInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  photoRail: {
    gap: PHOTO_GAP,
    paddingVertical: 4,
  },
  photoTile: {
    width: PHOTO_TILE_W,
    height: PHOTO_TILE_H,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  dot: {
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    height: 6,
  },
  dotIdle: {
    width: 6,
    height: 6,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 10,
  },
  favIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favEmoji: {
    fontSize: 15,
  },
  favText: {
    flex: 1,
    gap: 1,
  },
  gridWrap: {
    paddingHorizontal: GRID_INSET,
    paddingTop: 8,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridTile: {
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  saveCard: {
    minWidth: 168,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
  },
  toastHost: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  sheetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sheetEmojiInline: {
    fontSize: 15,
  },
  sheetClear: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  sheetInput: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
});

export default EditProfileScreen;
