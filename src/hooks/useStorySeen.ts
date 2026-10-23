import { useCallback, useEffect, useState } from 'react';
import { StoryUserGroup } from '../api';
import {
  isStoryGroupSeen,
  markStoriesSeen,
  peekSeenStoryIds,
  subscribeStorySeen,
} from '../services/stories/storySeenStore';

export function useStorySeen(viewerUserId: number | null | undefined) {
  const [seenIds, setSeenIds] = useState<Set<number>>(() =>
    peekSeenStoryIds(viewerUserId),
  );

  useEffect(() => {
    return subscribeStorySeen(viewerUserId, setSeenIds);
  }, [viewerUserId]);

  const isGroupSeen = useCallback(
    (group?: StoryUserGroup | null) => isStoryGroupSeen(group, seenIds),
    [seenIds],
  );

  const markSeen = useCallback(
    (storyIds: Array<number | null | undefined>) => {
      void markStoriesSeen(viewerUserId, storyIds);
    },
    [viewerUserId],
  );

  return { seenIds, isGroupSeen, markSeen };
}
