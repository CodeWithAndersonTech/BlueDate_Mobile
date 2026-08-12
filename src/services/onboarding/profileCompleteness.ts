import {
  getInterestTypes,
  getUserProfile,
  InterestTypeItem,
  UserProfileResponse,
} from '../../api';
import { loadProfilePhotos } from '../photos/photoStore';

export type ProfileCompleteness = {
  interestTypes: InterestTypeItem[];
  interestsComplete: boolean;
  hasPhoto: boolean;
  isComplete: boolean;
  profile: UserProfileResponse | null;
  avatarUri?: string;
  /** InterestTypeId → answer */
  answers: Record<number, string>;
};

export async function loadProfileCompleteness(
  userId: number,
  accessToken?: string | null,
): Promise<ProfileCompleteness> {
  const [profile, typesResponse, photos] = await Promise.all([
    getUserProfile(userId, accessToken),
    getInterestTypes(accessToken),
    loadProfilePhotos(userId, accessToken).catch(() => ({
      gallery: [] as { uri: string }[],
      avatarUri: undefined as string | undefined,
    })),
  ]);

  const interestTypes = [
    ...(typesResponse.GetAllInterestTypeQueryCommonObject ?? []),
  ].sort((a, b) => a.SortOrder - b.SortOrder);

  const answers: Record<number, string> = {};
  for (const type of interestTypes) {
    const existing = profile.Interests?.find(
      item => Number(item.InterestTypeId) === Number(type.Id),
    );
    answers[type.Id] = existing?.Value?.trim() ?? '';
  }

  const interestsComplete =
    interestTypes.length > 0 &&
    interestTypes.every(type => (answers[type.Id] ?? '').trim().length > 0);

  const hasPhoto = Boolean(
    photos.avatarUri ||
      photos.gallery.length > 0 ||
      (profile.ProfileImage ?? '').trim(),
  );

  return {
    interestTypes,
    interestsComplete,
    hasPhoto,
    isComplete: interestsComplete && hasPhoto,
    profile,
    avatarUri: photos.avatarUri ?? profile.ProfileImage ?? undefined,
    answers,
  };
}
