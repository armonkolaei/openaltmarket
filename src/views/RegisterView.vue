<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  displayName: '',
  email: '',
  password: ''
});

const localError = ref<string | null>(null);

const submit = async () => {
  localError.value = null;
  try {
    await authStore.register(form.email, form.password, form.displayName);
    await router.push('/dashboard');
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Unable to register.';
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section class="card-surface w-full max-w-md p-8">
        <h1 class="font-display text-3xl font-semibold text-slate-900">Create account</h1>
        <p class="mt-2 text-sm text-slate-600">Start sharing and customizing open-source alternatives.</p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div>
            <label for="name" class="mb-1 block text-sm font-medium text-slate-700">Display name</label>
            <input
              id="name"
              v-model="form.displayName"
              type="text"
              required
              autocomplete="name"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="Ada Lovelace"
            />
          </div>
          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="At least 8 characters"
            />
          </div>

          <p v-if="localError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ localError }}</p>

          <button
            type="submit"
            class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? 'Creating account...' : 'Register' }}
          </button>
          <p class="text-center text-xs text-slate-500">
            By registering you agree to our
            <RouterLink to="/terms" class="underline">Terms of Use</RouterLink> and
            <RouterLink to="/privacy" class="underline">Privacy Policy</RouterLink>.
          </p>
        </form>

        <p class="mt-6 text-sm text-slate-600">
          Already have an account?
          <RouterLink to="/login" class="font-medium text-brand-700 hover:text-brand-900">Login</RouterLink>
        </p>
      </section>
    </main>
  </div>
</template>