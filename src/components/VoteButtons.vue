<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { voteOnSubmission } from '@/lib/api';
import { applyVoteResult } from '@/lib/catalog';
import type { PublicSubmission } from '@/types/app';

const props = defineProps<{ app: PublicSubmission }>();

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isBusy = ref(false);
const error = ref<string | null>(null);

async function cast(direction: 1 | -1) {
  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  isBusy.value = true;
  error.value = null;
  try {
    // Clicking the active vote again retracts it; clicking the other arrow switches it.
    applyVoteResult(await voteOnSubmission(props.app.id, props.app.myVote === direction ? 0 : direction));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to record your vote.';
  } finally {
    isBusy.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <button
      type="button"
      class="rounded-lg p-1.5 text-lg leading-none transition disabled:opacity-50"
      :class="app.myVote === 1 ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'"
      :aria-pressed="app.myVote === 1"
      :aria-label="`Upvote ${app.name}`"
      :disabled="isBusy"
      @click="cast(1)"
    >
      ▲
    </button>
    <span
      class="min-w-[2ch] text-center font-display text-base font-semibold tabular-nums text-slate-900"
      :title="`${app.upvotes} up · ${app.downvotes} down`"
      :aria-label="`Score ${app.score}`"
    >
      {{ app.score }}
    </span>
    <button
      type="button"
      class="rounded-lg p-1.5 text-lg leading-none transition disabled:opacity-50"
      :class="app.myVote === -1 ? 'bg-rose-100 text-rose-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'"
      :aria-pressed="app.myVote === -1"
      :aria-label="`Downvote ${app.name}`"
      :disabled="isBusy"
      @click="cast(-1)"
    >
      ▼
    </button>
    <p v-if="error" class="max-w-[4.5rem] text-center text-[10px] text-rose-600" role="alert">{{ error }}</p>
  </div>
</template>
