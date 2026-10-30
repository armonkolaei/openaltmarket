<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const email = ref('');
const localError = ref<string | null>(null);
const localSuccess = ref<string | null>(null);

const submit = async () => {
  localError.value = null;
  localSuccess.value = null;
  try {
    await authStore.resetPassword(email.value);
    localSuccess.value = 'Password reset email sent. Please check your inbox.';
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Unable to send reset email.';
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section class="card-surface w-full max-w-md p-8">
        <h1 class="font-display text-3xl font-semibold text-slate-900">Reset password</h1>
        <p class="mt-2 text-sm text-slate-600">Enter your email to receive a password reset link.</p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>

          <p v-if="localError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ localError }}</p>
          <p v-if="localSuccess" class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ localSuccess }}</p>

          <button
            type="submit"
            class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? 'Sending...' : 'Send reset link' }}
          </button>
        </form>

        <p class="mt-6 text-sm text-slate-600">
          Back to
          <RouterLink to="/login" class="font-medium text-brand-700 hover:text-brand-900">Login</RouterLink>
        </p>
      </section>
    </main>
  </div>
</template>