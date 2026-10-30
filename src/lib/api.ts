import { auth } from './firebase';
import type { AppUserProfile } from '@/types/app';

interface ApiErrorBody {
  error?: string;
}

const defaultHeaders = {
  'Content-Type': 'application/json'
};

export class ProfileSyncUnavailableError extends Error {
  constructor(message = 'Profile sync endpoint is unavailable.') {
    super(message);
    this.name = 'ProfileSyncUnavailableError';
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!auth) {
    return {};
  }

  const user = auth.currentUser;
  if (!user) {
    return {};
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function syncUserProfile(payload: {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}): Promise<AppUserProfile> {
  let response: Response;

  try {
    response = await fetch('/api/users/sync', {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        ...(await getAuthHeader())
      },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new ProfileSyncUnavailableError();
  }

  if (response.status === 404) {
    throw new ProfileSyncUnavailableError();
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(errorBody.error ?? 'Failed to synchronize profile.');
  }

  const data = (await response.json()) as { profile: AppUserProfile };
  return data.profile;
}