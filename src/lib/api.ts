import { auth } from './firebase';
import type { AppSubmission, AppUserProfile, PublicSubmission, UserRole, VoteResult, VoteValue } from '@/types/app';

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

async function parseError(response: Response, fallback: string): Promise<Error> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 404) {
    return new Error('API endpoint unavailable. Run with Vercel dev or deploy API routes.');
  }

  if (contentType.includes('application/json')) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    return new Error(errorBody.error ?? `${fallback} (HTTP ${response.status})`);
  }

  const text = (await response.text().catch(() => '')).trim();
  return new Error(text || `${fallback} (HTTP ${response.status})`);
}

export async function createSubmission(payload: {
  name: string;
  description: string;
  websiteUrl: string;
  alternativesTo: string[];
  keywords: string[];
}): Promise<AppSubmission> {
  const response = await fetch('/api/submissions', {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to submit application suggestion.');
  }

  const data = (await response.json()) as { submission: AppSubmission };
  return data.submission;
}

export async function fetchApprovedSubmissions(): Promise<PublicSubmission[]> {
  const response = await fetch('/api/submissions?status=approved', {
    method: 'GET',
    headers: { ...defaultHeaders, ...(await getAuthHeader()) }
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to load alternatives.');
  }

  const data = (await response.json()) as { submissions: PublicSubmission[] };
  return data.submissions;
}

export async function voteOnSubmission(id: string, value: VoteValue): Promise<VoteResult> {
  const response = await fetch(`/api/submissions/${id}`, {
    method: 'PUT',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    },
    body: JSON.stringify({ value })
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to record your vote.');
  }

  return (await response.json()) as VoteResult;
}

export type AdminStatusFilter = AppSubmission['status'] | 'all';

export async function fetchPendingSubmissions(status: AdminStatusFilter = 'pending', search = ''): Promise<AppSubmission[]> {
  const params = new URLSearchParams({ status });
  if (search.trim()) {
    params.set('q', search.trim());
  }
  const response = await fetch(`/api/submissions?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    }
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to load pending submissions.');
  }

  const data = (await response.json()) as { submissions: AppSubmission[] };
  return data.submissions;
}

export async function fetchMySubmissions(): Promise<AppSubmission[]> {
  const response = await fetch('/api/submissions/mine', {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    }
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to load your submissions.');
  }

  const data = (await response.json()) as { submissions: AppSubmission[] };
  return data.submissions;
}

export async function fetchUsers(): Promise<AppUserProfile[]> {
  const response = await fetch('/api/admin/users', {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    }
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to load users.');
  }

  const data = (await response.json()) as { users: AppUserProfile[] };
  return data.users;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<AppUserProfile> {
  const response = await fetch('/api/admin/roles', {
    method: 'PATCH',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    },
    body: JSON.stringify({ uid, role })
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to update user role.');
  }

  const data = (await response.json()) as { user: AppUserProfile };
  return data.user;
}

export interface SubmissionEdits {
  name?: string;
  description?: string;
  websiteUrl?: string;
  alternativesTo?: string[];
  keywords?: string[];
}

export async function updateSubmission(
  id: string,
  changes: SubmissionEdits & { status?: AppSubmission['status'] }
): Promise<AppSubmission> {
  const response = await fetch(`/api/submissions/${id}`, {
    method: 'PATCH',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    },
    body: JSON.stringify(changes)
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to update submission.');
  }

  const data = (await response.json()) as { submission: AppSubmission };
  return data.submission;
}

export async function setUserDisabled(uid: string, disabled: boolean): Promise<AppUserProfile> {
  const response = await fetch('/api/admin/roles', {
    method: 'PATCH',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    },
    body: JSON.stringify({ uid, disabled })
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to update user access.');
  }

  const data = (await response.json()) as { user: AppUserProfile };
  return data.user;
}

export async function reviewSubmission(id: string, status: 'approved' | 'rejected'): Promise<AppSubmission> {
  const response = await fetch(`/api/submissions/${id}`, {
    method: 'PATCH',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to update submission status.');
  }

  const data = (await response.json()) as { submission: AppSubmission };
  return data.submission;
}

export async function deleteSubmission(id: string): Promise<void> {
  const response = await fetch(`/api/submissions/${id}`, {
    method: 'DELETE',
    headers: {
      ...defaultHeaders,
      ...(await getAuthHeader())
    }
  });

  if (!response.ok) {
    throw await parseError(response, 'Unable to delete submission.');
  }
}