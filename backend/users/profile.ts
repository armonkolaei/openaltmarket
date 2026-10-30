import { z } from 'zod';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile, UserProfileResponse } from '../types/user';

const profilePayloadSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  email: z.email().optional(),
  photoURL: z.url().nullable().optional()
});

export interface ProfilePatch {
  displayName?: string;
  email?: string;
  photoURL?: string | null;
}

export function parseProfilePatch(input: unknown): ProfilePatch {
  return profilePayloadSchema.parse(input);
}

export function buildUserProfile(token: DecodedIdToken, patch: ProfilePatch): Omit<UserProfile, 'createdAt' | 'lastLoginAt' | 'role'> {
  const email = token.email ?? patch.email;
  if (!email) {
    throw new Error('Email is required in Firebase token or request payload.');
  }

  const displayName = token.name ?? patch.displayName ?? email.split('@')[0] ?? 'OpenAlt User';

  return {
    uid: token.uid,
    displayName,
    email,
    photoURL: token.picture ?? patch.photoURL ?? null
  };
}

export function toUserProfileResponse(user: UserProfile): UserProfileResponse {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString()
  };
}