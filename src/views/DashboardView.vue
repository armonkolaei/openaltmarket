<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { createSubmission, fetchPendingSubmissions, fetchUsers, updateUserRole } from '@/lib/api';
import type { AppSubmission, AppUserProfile, UserRole } from '@/types/app';

const authStore = useAuthStore();

const isAdmin = computed(() => authStore.profile?.role === 'admin' || authStore.profile?.role === 'super_admin');
const isSuperAdmin = computed(() => authStore.profile?.role === 'super_admin');

const submissionForm = reactive({
  name: '',
  description: '',
  websiteUrl: '',
  alternativesTo: '',
  keywords: ''
});

const isSubmitting = ref(false);
const submissionSuccess = ref<string | null>(null);
const submissionError = ref<string | null>(null);

const pendingSubmissions = ref<AppSubmission[]>([]);
const pendingLoadError = ref<string | null>(null);
const isLoadingPending = ref(false);

const users = ref<AppUserProfile[]>([]);
const usersLoadError = ref<string | null>(null);
const roleUpdateError = ref<string | null>(null);
const roleUpdateSuccess = ref<string | null>(null);
const isLoadingUsers = ref(false);
const roleEdits = ref<Record<string, UserRole>>({});
const roleUpdateBusyUid = ref<string | null>(null);

function parseCsv(input: string): string[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

async function submitSuggestion() {
  isSubmitting.value = true;
  submissionError.value = null;
  submissionSuccess.value = null;
  try {
    await createSubmission({
      name: submissionForm.name,
      description: submissionForm.description,
      websiteUrl: submissionForm.websiteUrl,
      alternativesTo: parseCsv(submissionForm.alternativesTo),
      keywords: parseCsv(submissionForm.keywords)
    });

    submissionForm.name = '';
    submissionForm.description = '';
    submissionForm.websiteUrl = '';
    submissionForm.alternativesTo = '';
    submissionForm.keywords = '';
    submissionSuccess.value = 'Submission received and queued for admin review.';

    if (isAdmin.value) {
      await loadPendingSubmissions();
    }
  } catch (error) {
    submissionError.value = error instanceof Error ? error.message : 'Unable to submit suggestion.';
  } finally {
    isSubmitting.value = false;
  }
}

async function loadPendingSubmissions() {
  if (!isAdmin.value) {
    return;
  }

  isLoadingPending.value = true;
  pendingLoadError.value = null;
  try {
    pendingSubmissions.value = await fetchPendingSubmissions();
  } catch (error) {
    pendingLoadError.value = error instanceof Error ? error.message : 'Unable to load pending submissions.';
  } finally {
    isLoadingPending.value = false;
  }
}

async function loadUsers() {
  if (!isAdmin.value) {
    return;
  }

  isLoadingUsers.value = true;
  usersLoadError.value = null;
  try {
    users.value = await fetchUsers();
    roleEdits.value = Object.fromEntries(users.value.map((user) => [user.uid, user.role]));
  } catch (error) {
    usersLoadError.value = error instanceof Error ? error.message : 'Unable to load users.';
  } finally {
    isLoadingUsers.value = false;
  }
}

async function saveRole(uid: string) {
  const role = roleEdits.value[uid];
  if (!role) {
    return;
  }

  roleUpdateBusyUid.value = uid;
  roleUpdateError.value = null;
  roleUpdateSuccess.value = null;

  try {
    const updatedUser = await updateUserRole(uid, role);
    users.value = users.value.map((user) => (user.uid === uid ? updatedUser : user));
    roleUpdateSuccess.value = `Updated role for ${updatedUser.email}.`;
  } catch (error) {
    roleUpdateError.value = error instanceof Error ? error.message : 'Unable to update user role.';
  } finally {
    roleUpdateBusyUid.value = null;
  }
}

onMounted(async () => {
  await authStore.init();
  await loadPendingSubmissions();
  await loadUsers();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header class="mb-8">
        <h1 class="font-display text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p class="mt-2 text-sm text-slate-600">
          Welcome back, {{ authStore.profile?.displayName || authStore.firebaseUser?.email || 'Builder' }}.
        </p>
      </header>

      <section v-if="authStore.error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ authStore.error }}
      </section>

      <section v-else-if="!authStore.profile" class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
        Loading your profile...
      </section>

      <section v-else class="grid gap-5 md:grid-cols-2">
        <article class="card-surface p-5">
          <h2 class="font-display text-xl font-semibold text-slate-900">Profile</h2>
          <dl class="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              <dt class="font-medium text-slate-900">Name</dt>
              <dd>{{ authStore.profile.displayName }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-900">Email</dt>
              <dd>{{ authStore.profile.email }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-900">Role</dt>
              <dd class="capitalize">{{ authStore.profile.role }}</dd>
            </div>
          </dl>
        </article>

        <article class="card-surface p-5">
          <h2 class="font-display text-xl font-semibold text-slate-900">Submit an Alternative</h2>
          <p class="mt-2 text-sm text-slate-600">
            Suggest an open-source alternative for review by platform administrators.
          </p>

          <form class="mt-4 space-y-3" @submit.prevent="submitSuggestion">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-name">App name</label>
              <input
                id="submission-name"
                v-model="submissionForm.name"
                type="text"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                placeholder="Worthgrid"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-description">Description</label>
              <textarea
                id="submission-description"
                v-model="submissionForm.description"
                required
                rows="3"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                placeholder="Short overview of what this app does."
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-url">Website URL</label>
              <input
                id="submission-url"
                v-model="submissionForm.websiteUrl"
                type="url"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                placeholder="https://worthgrid.com"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-alternatives">Alternatives to</label>
              <input
                id="submission-alternatives"
                v-model="submissionForm.alternativesTo"
                type="text"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                placeholder="wealthica, mint"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-keywords">Keywords</label>
              <input
                id="submission-keywords"
                v-model="submissionForm.keywords"
                type="text"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                placeholder="finance, budgeting, net worth"
              />
            </div>

            <p v-if="submissionError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ submissionError }}</p>
            <p v-if="submissionSuccess" class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ submissionSuccess }}</p>

            <button
              type="submit"
              class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit Suggestion' }}
            </button>
          </form>
        </article>
      </section>

      <section v-if="isAdmin" class="mt-8 space-y-5">
        <article class="card-surface p-5">
          <h2 class="font-display text-xl font-semibold text-slate-900">Pending Submissions</h2>
          <p class="mt-2 text-sm text-slate-600">Applications waiting for administrative review.</p>

          <p v-if="pendingLoadError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ pendingLoadError }}</p>
          <p v-else-if="isLoadingPending" class="mt-3 text-sm text-slate-600">Loading submissions...</p>
          <p v-else-if="pendingSubmissions.length === 0" class="mt-3 text-sm text-slate-600">No pending submissions right now.</p>
          <div v-else class="mt-4 space-y-3">
            <article v-for="submission in pendingSubmissions" :key="submission.id" class="rounded-xl border border-slate-200 p-4">
              <h3 class="font-semibold text-slate-900">{{ submission.name }}</h3>
              <p class="mt-1 text-sm text-slate-600">{{ submission.description }}</p>
              <a :href="submission.websiteUrl" target="_blank" rel="noreferrer" class="mt-2 inline-block text-sm text-brand-700 hover:text-brand-900">
                {{ submission.websiteUrl }}
              </a>
              <p class="mt-2 text-xs text-slate-500">
                Submitted by {{ submission.submittedByEmail }} · {{ new Date(submission.createdAt).toLocaleString() }}
              </p>
            </article>
          </div>
        </article>

        <article class="card-surface p-5">
          <h2 class="font-display text-xl font-semibold text-slate-900">User Role Management</h2>
          <p class="mt-2 text-sm text-slate-600">Manage platform roles for registered users.</p>

          <p v-if="!isSuperAdmin" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You can view users, but only super admins can change roles.
          </p>
          <p v-if="usersLoadError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ usersLoadError }}</p>
          <p v-else-if="isLoadingUsers" class="mt-3 text-sm text-slate-600">Loading users...</p>
          <p v-else-if="users.length === 0" class="mt-3 text-sm text-slate-600">No users found.</p>

          <p v-if="roleUpdateError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ roleUpdateError }}</p>
          <p v-if="roleUpdateSuccess" class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ roleUpdateSuccess }}</p>

          <div v-if="users.length > 0" class="mt-4 overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500">
                  <th class="px-2 py-2 font-medium">Email</th>
                  <th class="px-2 py-2 font-medium">Display Name</th>
                  <th class="px-2 py-2 font-medium">Role</th>
                  <th class="px-2 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.uid" class="border-b border-slate-100">
                  <td class="px-2 py-2 text-slate-700">{{ user.email }}</td>
                  <td class="px-2 py-2 text-slate-700">{{ user.displayName }}</td>
                  <td class="px-2 py-2">
                    <select
                      v-model="roleEdits[user.uid]"
                      class="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      :disabled="!isSuperAdmin"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </td>
                  <td class="px-2 py-2">
                    <button
                      type="button"
                      class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      :disabled="!isSuperAdmin || roleUpdateBusyUid === user.uid"
                      @click="saveRole(user.uid)"
                    >
                      {{ roleUpdateBusyUid === user.uid ? 'Saving...' : 'Save Role' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>