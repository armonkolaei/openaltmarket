import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z, ZodError } from 'zod';
import { verifyRequestToken, AuthError } from '../../backend/auth/verifyToken.js';
import { getRequesterProfile, requireRole } from '../../backend/auth/authorization.js';
import { getUsersCollection } from '../../backend/db/mongo.js';
import { jsonError, jsonOk, requireMethod } from '../../backend/utils/http.js';
import { toUserProfileResponse } from '../../backend/users/profile.js';
import type { UserRole } from '../../backend/types/user.js';

const roleUpdateSchema = z.object({
  uid: z.string().trim().min(1),
  role: z.enum(['user', 'admin', 'super_admin'])
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const invalidMethod = requireMethod(req.method, 'PATCH');
  if (invalidMethod) {
    return jsonError(res, 405, invalidMethod);
  }

  try {
    const token = await verifyRequestToken(req);
    const requester = await getRequesterProfile(token);
    requireRole(requester, ['super_admin']);

    const payload = roleUpdateSchema.parse(req.body ?? {});
    const nextRole = payload.role as UserRole;

    const users = await getUsersCollection();
    const existing = await users.findOne({ uid: payload.uid });
    if (!existing) {
      return jsonError(res, 404, 'User not found.');
    }

    if (requester.uid === payload.uid && nextRole !== 'super_admin') {
      return jsonError(res, 400, 'Super admin cannot remove their own super_admin role.');
    }

    await users.updateOne({ uid: payload.uid }, { $set: { role: nextRole } });
    const updated = await users.findOne({ uid: payload.uid });
    if (!updated) {
      return jsonError(res, 500, 'Unable to load updated user profile.');
    }

    return jsonOk(res, { user: toUserProfileResponse(updated) });
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