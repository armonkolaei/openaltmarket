<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  email: '',
  password: ''
});

const localError = ref<string | null>(null);

const submit = async () => {
  localError.value = null;
  try {
    await authStore.login(form.email, form.password);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.push(redirect);
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Unable to sign in.';
  }
};

const signInWithGoogle = async () => {
  localError.value = null;
  try {
    await authStore.loginWithGoogle();
    await router.push('/dashboard');
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Google sign-in failed.';
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section class="card-surface w-full max-w-md p-8">
        <h1 class="font-display text-3xl font-semibold text-slate-900">Login</h1>
        <p class="mt-2 text-sm text-slate-600">Access your OpenAltMarket dashboard.</p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
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
              autocomplete="current-password"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          <p v-if="localError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ localError }}</p>

          <button
            type="submit"
            class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? 'Signing in...' : 'Login' }}
          </button>
        </form>

        <button
          type="button"
          class="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-700 hover:text-brand-700"
          @click="signInWithGoogle"
          :disabled="authStore.isLoading"
        >
          Continue with Google
        </button>

        <div class="mt-6 flex items-center justify-between text-sm">
          <RouterLink to="/reset-password" class="text-brand-700 hover:text-brand-900">Forgot password?</RouterLink>
          <RouterLink to="/register" class="text-brand-700 hover:text-brand-900">Create account</RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>