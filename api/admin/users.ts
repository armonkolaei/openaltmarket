import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRequestToken, AuthError } from '../../backend/auth/verifyToken';
import { getRequesterProfile, isAdminRole } from '../../backend/auth/authorization';
import { getUsersCollection } from '../../backend/db/mongo';
import { jsonError, jsonOk, requireMethod } from '../../backend/utils/http';
import { toUserProfileResponse } from '../../backend/users/profile';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const invalidMethod = requireMethod(req.method, 'GET');
  if (invalidMethod) {
    return jsonError(res, 405, invalidMethod);
  }

  try {
    const token = await verifyRequestToken(req);
    const requester = await getRequesterProfile(token);

    if (!isAdminRole(requester.role)) {
      throw new AuthError('You are not authorized to view users.', 403);
    }

    const users = await getUsersCollection();
    const docs = await users.find({}).sort({ createdAt: -1 }).limit(500).toArray();

    return jsonOk(res, { users: docs.map((doc) => toUserProfileResponse(doc)) });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}