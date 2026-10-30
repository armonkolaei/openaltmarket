import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZodError } from 'zod';
import { verifyRequestToken, AuthError } from '../../backend/auth/verifyToken.js';
import { getUsersCollection } from '../../backend/db/mongo.js';
import { parseProfilePatch, buildUserProfile, toUserProfileResponse } from '../../backend/users/profile.js';
import { jsonError, jsonOk, requireMethod } from '../../backend/utils/http.js';
import type { UserProfile } from '../../backend/types/user.js';
import { env } from '../../backend/utils/env.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const invalidMethod = requireMethod(req.method, 'POST');
  if (invalidMethod) {
    return jsonError(res, 405, invalidMethod);
  }

  try {
    const decodedToken = await verifyRequestToken(req);
    const patch = parseProfilePatch(req.body ?? {});
    const profileBase = buildUserProfile(decodedToken, patch);

    const users = await getUsersCollection();
    const now = new Date();
    const existing = await users.findOne({ uid: profileBase.uid });
    const isConfiguredSuperAdmin = env.superAdminEmails.includes(profileBase.email.toLowerCase());

    const nextRole = existing?.role
      ? isConfiguredSuperAdmin
        ? 'super_admin'
        : existing.role
      : isConfiguredSuperAdmin
        ? 'super_admin'
        : 'user';

    await users.updateOne(
      { uid: profileBase.uid },
      {
        $set: {
          ...profileBase,
          role: nextRole,
          lastLoginAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    const persisted = await users.findOne({ uid: profileBase.uid });
    if (!persisted) {
      return jsonError(res, 500, 'Unable to load synchronized user profile.');
    }

    return jsonOk(res, { profile: toUserProfileResponse(persisted as UserProfile) });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }
    if (error instanceof ZodError) {
      return jsonError(res, 400, error.issues.map((issue) => issue.message).join('; '));
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}