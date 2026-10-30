import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, verifyRequestToken } from '../../backend/auth/verifyToken';
import { getSubmissionsCollection } from '../../backend/db/mongo';
import { toSubmissionResponse } from '../../backend/submissions/submission';
import { jsonError, jsonOk, requireMethod } from '../../backend/utils/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const invalidMethod = requireMethod(req.method, 'GET');
  if (invalidMethod) {
    return jsonError(res, 405, invalidMethod);
  }

  try {
    const token = await verifyRequestToken(req);
    const submissions = await getSubmissionsCollection();
    const docs = await submissions
      .find({ submittedByUid: token.uid })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return jsonOk(res, { submissions: docs.map((doc) => toSubmissionResponse(doc)) });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}