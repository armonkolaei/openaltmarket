import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile, UserRole } from '../types/user';
import { AuthError } from './verifyToken';
import { getUsersCollection } from '../db/mongo';

export async function getRequesterProfile(token: DecodedIdToken): Promise<UserProfile> {
  const users = await getUsersCollection();
  const profile = await users.findOne({ uid: token.uid });
  if (!profile) {
    throw new AuthError('Requester profile not found. Please log in again.', 403);
  }

  return profile;
}

export function requireRole(profile: UserProfile, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(profile.role)) {
    throw new AuthError('You are not authorized to perform this action.', 403);
  }
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}