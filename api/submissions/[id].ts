import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { z, ZodError } from 'zod';
import { AuthError, verifyRequestToken } from '../../backend/auth/verifyToken';
import { getRequesterProfile, isAdminRole } from '../../backend/auth/authorization';
import { getSubmissionsCollection } from '../../backend/db/mongo';
import { toSubmissionResponse } from '../../backend/submissions/submission';
import { jsonError, jsonOk } from '../../backend/utils/http';

const reviewPayloadSchema = z.object({
  status: z.enum(['approved', 'rejected'])
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id;
  const submissionId = Array.isArray(id) ? id[0] : id;

  if (!submissionId || !ObjectId.isValid(submissionId)) {
    return jsonError(res, 400, 'Invalid submission id.');
  }

  if (req.method?.toUpperCase() === 'PATCH') {
    return handleReview(req, res, submissionId);
  }

  if (req.method?.toUpperCase() === 'DELETE') {
    return handleDelete(req, res, submissionId);
  }

  return jsonError(res, 405, `Method ${req.method ?? 'UNKNOWN'} not allowed. Use PATCH or DELETE.`);
}

async function assertAdmin(req: VercelRequest) {
  const token = await verifyRequestToken(req);
  const profile = await getRequesterProfile(token);
  if (!isAdminRole(profile.role)) {
    throw new AuthError('You are not authorized to review submissions.', 403);
  }
  return profile;
}

async function handleReview(req: VercelRequest, res: VercelResponse, submissionId: string) {
  try {
    const admin = await assertAdmin(req);
    const payload = reviewPayloadSchema.parse(req.body ?? {});

    const submissions = await getSubmissionsCollection();
    const now = new Date();

    const result = await submissions.findOneAndUpdate(
      { _id: new ObjectId(submissionId) },
      {
        $set: {
          status: payload.status,
          reviewedByUid: admin.uid,
          reviewedAt: now,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return jsonError(res, 404, 'Submission not found.');
    }

    return jsonOk(res, { submission: toSubmissionResponse(result) });
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

async function handleDelete(req: VercelRequest, res: VercelResponse, submissionId: string) {
  try {
    await assertAdmin(req);

    const submissions = await getSubmissionsCollection();
    const result = await submissions.deleteOne({ _id: new ObjectId(submissionId) });

    if (result.deletedCount === 0) {
      return jsonError(res, 404, 'Submission not found.');
    }

    return jsonOk(res, { success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}