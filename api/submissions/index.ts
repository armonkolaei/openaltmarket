import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZodError } from 'zod';
import { AuthError, verifyRequestToken } from '../../backend/auth/verifyToken.js';
import { getRequesterProfile, isAdminRole } from '../../backend/auth/authorization.js';
import { getSubmissionsCollection } from '../../backend/db/mongo.js';
import { buildSubmission, parseSubmissionPayload, toSubmissionResponse } from '../../backend/submissions/submission.js';
import { jsonError, jsonOk } from '../../backend/utils/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === 'POST') {
    return handleCreate(req, res);
  }

  if (req.method?.toUpperCase() === 'GET') {
    return handleListPending(req, res);
  }

  return jsonError(res, 405, `Method ${req.method ?? 'UNKNOWN'} not allowed. Use GET or POST.`);
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const token = await verifyRequestToken(req);
    const email = token.email;
    if (!email) {
      return jsonError(res, 400, 'Authenticated user email is missing from Firebase token.');
    }

    const payload = parseSubmissionPayload(req.body ?? {});

    const submissions = await getSubmissionsCollection();
    const created = buildSubmission(payload, token.uid, email);
    const result = await submissions.insertOne(created);
    const persisted = await submissions.findOne({ _id: result.insertedId });

    if (!persisted) {
      return jsonError(res, 500, 'Unable to load created submission.');
    }

    return jsonOk(res, { submission: toSubmissionResponse(persisted) }, 201);
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

async function handleListPending(req: VercelRequest, res: VercelResponse) {
  try {
    const token = await verifyRequestToken(req);
    const profile = await getRequesterProfile(token);

    if (!isAdminRole(profile.role)) {
      throw new AuthError('You are not authorized to view pending submissions.', 403);
    }

    const submissions = await getSubmissionsCollection();
    const docs = await submissions.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(200).toArray();

    return jsonOk(res, { submissions: docs.map((doc) => toSubmissionResponse(doc)) });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}