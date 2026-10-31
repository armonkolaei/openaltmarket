import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { AuthError, verifyRequestToken } from '../../backend/auth/verifyToken.js';
import { getRequesterProfile, isAdminRole } from '../../backend/auth/authorization.js';
import { refreshGithubSnapshots } from '../../backend/submissions/refresh.js';
import { jsonError, jsonOk } from '../../backend/utils/http.js';

function isCronRequest(req: VercelRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.authorization === `Bearer ${secret}`;
}

// GET: Vercel Cron (authenticated with CRON_SECRET). POST: an admin, optionally for a single submission.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();

  try {
    if (method === 'GET') {
      if (!isCronRequest(req)) {
        return jsonError(res, 401, 'Unauthorized.');
      }
      return jsonOk(res, { summary: await refreshGithubSnapshots({ limit: 25 }) });
    }

    if (method === 'POST') {
      const token = await verifyRequestToken(req);
      const requester = await getRequesterProfile(token);
      if (!isAdminRole(requester.role)) {
        throw new AuthError('You are not authorized to refresh GitHub data.', 403);
      }

      const id = typeof req.body?.id === 'string' ? req.body.id : undefined;
      if (id && !ObjectId.isValid(id)) {
        return jsonError(res, 400, 'Invalid submission id.');
      }
      return jsonOk(res, { summary: await refreshGithubSnapshots({ id, limit: id ? 1 : 50 }) });
    }

    return jsonError(res, 405, `Method ${req.method ?? 'UNKNOWN'} not allowed. Use GET or POST.`);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }
    return jsonError(res, 500, error instanceof Error ? error.message : 'Unexpected server error.');
  }
}
