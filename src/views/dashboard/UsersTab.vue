<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { fetchUsers, updateUserRole } from '@/lib/api';
import type { AppUserProfile, UserRole } from '@/types/app';

const authStore = useAuthStore();
const isSuperAdmin = computed(() => authStore.profile?.role === 'super_admin');

const users = ref<AppUserProfile[]>([]);
const loadError = ref<string | null>(null);
const updateError = ref<string | null>(null);
const updateSuccess = ref<string | null>(null);
const isLoading = ref(false);
const roleEdits = ref<Record<string, UserRole>>({});
const busyUid = ref<string | null>(null);

async function load() {
  isLoading.value = true;
  loadError.value = null;
  try {
    users.value = await fetchUsers();
    roleEdits.value = Object.fromEntries(users.value.map((user) => [user.uid, user.role]));
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Unable to load users.';
  } finally {
    isLoading.value = false;
  }
}

async function saveRole(uid: string) {
  const role = roleEdits.value[uid];
  if (!role) return;

  busyUid.value = uid;
  updateError.value = null;
  updateSuccess.value = null;
  try {
    const updated = await updateUserRole(uid, role);
    users.value = users.value.map((user) => (user.uid === uid ? updated : user));
    updateSuccess.value = `Updated role for ${updated.email}.`;
  } catch (err) {
    updateError.value = err instanceof Error ? err.message : 'Unable to update user role.';
  } finally {
    busyUid.value = null;
  }
}

onMounted(load);
</script>

<template>
  <article class="card-surface p-5">
    <h2 class="font-display text-xl font-semibold text-slate-900">User Role Management</h2>
    <p class="mt-2 text-sm text-slate-600">Manage platform roles for registered users.</p>

    <p v-if="!isSuperAdmin" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
      You can view users, but only super admins can change roles.
    </p>
    <p v-if="loadError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ loadError }}</p>
    <p v-else-if="isLoading" class="mt-3 text-sm text-slate-600">Loading users...</p>
    <p v-else-if="users.length === 0" class="mt-3 text-sm text-slate-600">No users found.</p>
    <p v-if="updateError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ updateError }}</p>
    <p v-if="updateSuccess" class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ updateSuccess }}</p>

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
              <select v-model="roleEdits[user.uid]" class="rounded-lg border border-slate-300 px-2 py-1 text-sm" :disabled="!isSuperAdmin">
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </td>
            <td class="px-2 py-2">
              <button
                type="button"
                class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                :disabled="!isSuperAdmin || busyUid === user.uid"
                @click="saveRole(user.uid)"
              >
                {{ busyUid === user.uid ? 'Saving...' : 'Save Role' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>
</template>
