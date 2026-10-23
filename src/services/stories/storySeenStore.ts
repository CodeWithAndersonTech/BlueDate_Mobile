import { StoryUserGroup } from '../../api';
import { appStorage } from '../../utils/appStorage';

const MAX_IDS = 400;

type Listener = (ids: Set<number>) => void;

const memory = new Map<number, Set<number>>();
const listeners = new Map<number, Set<Listener>>();
const hydrate = new Map<number, Promise<void>>();

function keyFor(viewerUserId: number) {
  return `@meerk/story-seen/${viewerUserId}`;
}

function emit(viewerUserId: number) {
  const ids = memory.get(viewerUserId) ?? new Set<number>();
  listeners.get(viewerUserId)?.forEach(fn => fn(new Set(ids)));
}

async function ensureHydrated(viewerUserId: number) {
  if (!viewerUserId || memory.has(viewerUserId)) return;
  const running = hydrate.get(viewerUserId);
  if (running) {
    await running;
    return;
  }
  const task = (async () => {
    try {
      const raw = await appStorage.getItem(keyFor(viewerUserId));
      const parsed = raw ? (JSON.parse(raw) as number[]) : [];
      memory.set(
        viewerUserId,
        new Set(parsed.filter(id => Number.isFinite(id) && id > 0)),
      );
    } catch {
      memory.set(viewerUserId, new Set());
    }
  })().finally(() => {
    hydrate.delete(viewerUserId);
  });
  hydrate.set(viewerUserId, task);
  await task;
}

export function peekSeenStoryIds(viewerUserId: number | null | undefined): Set<number> {
  if (!viewerUserId) return new Set();
  return new Set(memory.get(viewerUserId) ?? []);
}

export function isStoryGroupSeen(
  group: StoryUserGroup | null | undefined,
  seenIds: Set<number>,
): boolean {
  const ids = (group?.Stories ?? [])
    .map(story => Number(story.Id))
    .filter(id => id > 0);
  return ids.length > 0 && ids.every(id => seenIds.has(id));
}

export async function markStoriesSeen(
  viewerUserId: number | null | undefined,
  storyIds: Array<number | null | undefined>,
): Promise<void> {
  if (!viewerUserId) return;
  await ensureHydrated(viewerUserId);
  const next = memory.get(viewerUserId) ?? new Set<number>();
  let changed = false;
  storyIds.forEach(id => {
    const n = Number(id);
    if (n > 0 && !next.has(n)) {
      next.add(n);
      changed = true;
    }
  });
  if (!changed) return;
  const trimmed = [...next].slice(-MAX_IDS);
  memory.set(viewerUserId, new Set(trimmed));
  emit(viewerUserId);
  void appStorage.setItem(keyFor(viewerUserId), JSON.stringify(trimmed));
}

export function subscribeStorySeen(
  viewerUserId: number | null | undefined,
  listener: Listener,
): () => void {
  if (!viewerUserId) return () => undefined;
  let bucket = listeners.get(viewerUserId);
  if (!bucket) {
    bucket = new Set();
    listeners.set(viewerUserId, bucket);
  }
  bucket.add(listener);
  void ensureHydrated(viewerUserId).then(() => listener(peekSeenStoryIds(viewerUserId)));
  return () => {
    bucket?.delete(listener);
    if (bucket && bucket.size === 0) {
      listeners.delete(viewerUserId);
    }
  };
}
