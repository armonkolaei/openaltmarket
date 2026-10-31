<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AppCard from '@/components/AppCard.vue';
import { countTags, filterApps, loadCatalog, rankScore, useCatalog } from '@/lib/catalog';

const route = useRoute();
const router = useRouter();
const { apps, isLoading, loadError } = useCatalog();

const first = (value: unknown) => (Array.isArray(value) ? String(value[0] ?? '') : typeof value === 'string' ? value : '');

const query = ref(first(route.query.q));
const replaces = ref<string | null>(first(route.query.replaces).toLowerCase() || null);
const topic = ref<string | null>(first(route.query.topic).toLowerCase() || null);

const replacedOptions = computed(() => countTags(apps.value, (item) => item.alternativesTo, 100));
const topicOptions = computed(() => countTags(apps.value, (item) => item.keywords, 100));
const sort = ref<'top' | 'newest'>('top');
const results = computed(() =>
  [...filterApps(apps.value, query.value, replaces.value, topic.value)].sort((a, b) =>
    sort.value === 'top'
      ? rankScore(b) - rankScore(a) || b.approvedAt.localeCompare(a.approvedAt)
      : b.approvedAt.localeCompare(a.approvedAt)
  )
);
const hasFilters = computed(() => Boolean(query.value || replaces.value || topic.value));

watch([query, replaces, topic], () => {
  const next: Record<string, string> = {};
  if (query.value.trim()) next.q = query.value.trim();
  if (replaces.value) next.replaces = replaces.value;
  if (topic.value) next.topic = topic.value;
  void router.replace({ query: next });
});

watch(
  () => route.query,
  (q) => {
    query.value = first(q.q);
    replaces.value = first(q.replaces).toLowerCase() || null;
    topic.value = first(q.topic).toLowerCase() || null;
  }
);

function toggleReplaces(value: string) {
  replaces.value = replaces.value === value ? null : value;
}

function toggleTopic(value: string) {
  topic.value = topic.value === value ? null : value;
}

function clearAll() {
  query.value = '';
  replaces.value = null;
  topic.value = null;
}

onMounted(() => {
  void loadCatalog();
});
</script>

<template>
  <DefaultLayout>
    <template #header>
      <SiteHeader />
    </template>

    <section class="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <h1 class="font-display text-3xl font-semibold text-slate-900">Explore alternatives</h1>
      <p class="mt-2 text-sm text-slate-600">Pick the app you want to leave, or search by name and topic. Select a result to see its details and licence.</p>

      <form class="mt-6" role="search" aria-label="Search alternatives" @submit.prevent>
        <label for="explore-search" class="sr-only">Search alternatives</label>
        <input
          id="explore-search"
          v-model="query"
          type="search"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
          placeholder="Search alternatives..."
        />
      </form>

      <div v-if="replacedOptions.length > 0" class="mt-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Alternative to</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="option in replacedOptions"
            :key="option.label"
            type="button"
            :aria-pressed="replaces === option.label"
            class="rounded-full border px-3 py-1 text-sm transition"
            :class="replaces === option.label ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-500'"
            @click="toggleReplaces(option.label)"
          >
            {{ option.label }} <span class="text-xs opacity-70">{{ option.count }}</span>
          </button>
        </div>
      </div>

      <div v-if="topicOptions.length > 0" class="mt-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Topics</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="option in topicOptions"
            :key="option.label"
            type="button"
            :aria-pressed="topic === option.label"
            class="rounded-full border px-3 py-1 text-sm transition"
            :class="topic === option.label ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-500'"
            @click="toggleTopic(option.label)"
          >
            #{{ option.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-slate-600" aria-live="polite">{{ results.length }} result{{ results.length === 1 ? '' : 's' }}</p>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm text-slate-600">
            Sort
            <select v-model="sort" class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm">
              <option value="top">Top voted</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button v-if="hasFilters" type="button" class="text-sm font-semibold text-brand-700 hover:text-brand-900" @click="clearAll">
            Clear filters
          </button>
        </div>
      </div>

      <p v-if="loadError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ loadError }}</p>
      <p v-else-if="isLoading && apps.length === 0" class="mt-4 text-sm text-slate-600">Loading alternatives...</p>
      <div v-else-if="results.length === 0" class="card-surface mt-4 p-8 text-center">
        <p class="font-display text-lg font-semibold text-slate-900">No matches found</p>
        <p class="mt-1 text-sm text-slate-600">Try a different search, or suggest the alternative you were hoping to find.</p>
        <router-link
          :to="{ name: 'submit' }"
          class="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Submit an app
        </router-link>
      </div>
      <div v-else class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard v-for="item in results" :key="item.id" :app="item" />
      </div>
    </section>

    <template #footer>
      <SiteFooter />
    </template>
  </DefaultLayout>
</template>
