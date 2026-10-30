import { computed, ref } from 'vue';
import { fetchApprovedSubmissions } from '@/lib/api';
import type { PublicSubmission, VoteResult } from '@/types/app';

export interface TagCount {
  label: string;
  count: number;
}

const apps = ref<PublicSubmission[]>([]);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const hasLoaded = ref(false);

export function applyVoteResult(result: VoteResult) {
  apps.value = apps.value.map((item) =>
    item.id === result.id
      ? { ...item, upvotes: result.upvotes, downvotes: result.downvotes, score: result.score, myVote: result.myVote }
      : item
  );
}

export async function loadCatalog(force = false) {
  if (isLoading.value || (hasLoaded.value && !force)) {
    return;
  }

  isLoading.value = true;
  loadError.value = null;
  try {
    apps.value = await fetchApprovedSubmissions();
    hasLoaded.value = true;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load alternatives.';
  } finally {
    isLoading.value = false;
  }
}

export function countTags(items: PublicSubmission[], pick: (item: PublicSubmission) => string[], limit = 12): TagCount[] {
  const counts = new Map<string, TagCount>();
  for (const item of items) {
    for (const raw of new Set(pick(item).map((tag) => tag.trim().toLowerCase()))) {
      if (!raw) continue;
      const entry = counts.get(raw);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(raw, { label: raw, count: 1 });
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit);
}

export function filterApps(
  items: PublicSubmission[],
  query: string,
  replaces: string | null,
  keyword: string | null
): PublicSubmission[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    if (replaces && !item.alternativesTo.some((value) => value.toLowerCase() === replaces)) return false;
    if (keyword && !item.keywords.some((value) => value.toLowerCase() === keyword)) return false;
    if (terms.length === 0) return true;

    const haystack = [item.name, item.description, item.websiteUrl, ...item.alternativesTo, ...item.keywords]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function useCatalog() {
  return {
    apps,
    isLoading,
    loadError,
    hasLoaded,
    topReplaced: computed(() => countTags(apps.value, (item) => item.alternativesTo)),
    topKeywords: computed(() => countTags(apps.value, (item) => item.keywords)),
    latest: computed(() =>
      [...apps.value].sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
    ),
    reload: () => loadCatalog(true)
  };
}
