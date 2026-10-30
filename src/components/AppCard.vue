<script setup lang="ts">
import { computed } from 'vue';
import type { PublicSubmission } from '@/types/app';

const props = defineProps<{ app: PublicSubmission }>();

const host = computed(() => {
  try {
    return new URL(props.app.websiteUrl).hostname.replace(/^www\./, '');
  } catch {
    return props.app.websiteUrl;
  }
});
</script>

<template>
  <a
    :href="app.websiteUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="card-surface group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-400"
  >
    <div class="flex items-start justify-between gap-3">
      <h3 class="font-display text-lg font-semibold text-slate-900 group-hover:text-brand-700">{{ app.name }}</h3>
      <span class="shrink-0 text-xs text-slate-400" aria-hidden="true">↗</span>
    </div>
    <p class="mt-1 text-xs text-slate-500">{{ host }}</p>
    <p class="mt-3 line-clamp-3 text-sm text-slate-600">{{ app.description }}</p>

    <div class="mt-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Alternative to</p>
      <div class="mt-1 flex flex-wrap gap-1.5">
        <span
          v-for="name in app.alternativesTo.slice(0, 4)"
          :key="name"
          class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800"
        >
          {{ name }}
        </span>
        <span v-if="app.alternativesTo.length > 4" class="px-1 text-xs text-slate-500">
          +{{ app.alternativesTo.length - 4 }}
        </span>
      </div>
    </div>

    <div class="mt-auto flex flex-wrap gap-1.5 pt-4">
      <span v-for="tag in app.keywords.slice(0, 4)" :key="tag" class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        #{{ tag }}
      </span>
    </div>
  </a>
</template>
