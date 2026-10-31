<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { fetchGithubPreview, type GithubPreview, type GithubPreviewResult } from '@/lib/githubPreview';
import { licenseClasses } from '@/lib/repoInfo';
import { parseGithubUrl } from '../../shared/githubUrl';

const props = withDefaults(defineProps<{ url: string; auto?: boolean }>(), { auto: true });
const emit = defineEmits<{ (e: 'result', value: GithubPreviewResult | null): void }>();

const result = ref<GithubPreviewResult | null>(null);
const isChecking = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;

async function check() {
  controller?.abort();
  controller = new AbortController();
  isChecking.value = true;
  try {
    result.value = await fetchGithubPreview(props.url, controller.signal);
    emit('result', result.value);
  } catch {
    // Aborted by a newer check; the newer call reports its own result.
  } finally {
    isChecking.value = false;
  }
}

function reset() {
  controller?.abort();
  isChecking.value = false;
  result.value = null;
  emit('result', null);
}

watch(
  () => props.url,
  (value) => {
    clearTimeout(timer);
    if (!props.auto) return;
    if (!value.trim()) return reset();
    // Format problems are shown immediately; the network check waits until typing pauses.
    if (!parseGithubUrl(value)) {
      controller?.abort();
      isChecking.value = false;
      result.value = { status: 'invalid', message: 'Use a link like https://github.com/owner/repo' };
      emit('result', result.value);
      return;
    }
    timer = setTimeout(check, 600);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimeout(timer);
  controller?.abort();
});

const preview = (value: GithubPreviewResult | null): GithubPreview | null => (value?.status === 'ok' ? value.preview : null);
</script>

<template>
  <div class="mt-2 text-sm" aria-live="polite">
    <button
      v-if="!auto && !result && !isChecking"
      type="button"
      class="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-600"
      @click="check"
    >
      Preview license from GitHub
    </button>
    <p v-if="isChecking" class="text-xs text-slate-500">Checking GitHub...</p>

    <template v-else-if="result">
      <p v-if="result.status === 'invalid' || result.status === 'not_found'" class="text-xs text-rose-700" role="alert">
        {{ result.message }}
      </p>
      <p v-else-if="result.status === 'unavailable'" class="text-xs text-amber-700">{{ result.message }}</p>

      <div v-else-if="preview(result)" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p class="text-xs font-semibold text-emerald-700">✓ Found {{ preview(result)!.fullName }}</p>
        <p class="mt-1 text-xs text-slate-600">
          ★ {{ preview(result)!.stars.toLocaleString() }} · ⑂ {{ preview(result)!.forks.toLocaleString() }} forks
          <span v-if="preview(result)!.archived"> · archived</span>
        </p>
        <p class="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            class="rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset"
            :class="
              preview(result)!.licenseInfo.freeToUse
                ? 'bg-amber-100 text-amber-900 ring-amber-300'
                : licenseClasses[preview(result)!.licenseInfo.category]
            "
          >
            {{ preview(result)!.licenseInfo.freeToUse ? '★ ' : '' }}{{ preview(result)!.licenseInfo.spdxId ?? preview(result)!.licenseInfo.name }}
          </span>
          <span class="text-slate-500">{{ preview(result)!.licenseInfo.label }}</span>
        </p>
        <p class="mt-2 text-xs leading-relaxed text-slate-600">{{ preview(result)!.licenseInfo.summary }}</p>
        <p class="mt-2 text-[11px] text-slate-400">
          Preview only. We confirm the license directly from GitHub when an admin approves your submission.
        </p>
      </div>
    </template>
  </div>
</template>
