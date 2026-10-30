import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { z, ZodError } from 'zod';
import { AuthError, verifyRequestToken } from '../../backend/auth/verifyToken.js';
import { assertActiveUser, getRequesterProfile, isAdminRole } from '../../backend/auth/authorization.js';
import { getSubmissionsCollection, getVotesCollection } from '../../backend/db/mongo.js';
import { submissionEditSchema, toSubmissionResponse } from '../../backend/submissions/submission.js';
import { EMPTY_TOTALS } from '../../backend/submissions/voteMath.js';
import { getVoteTotals, setVote } from '../../backend/submissions/votes.js';
import { jsonError, jsonOk } from '../../backend/utils/http.js';

const reviewPayloadSchema = submissionEditSchema
  .extend({ status: z.enum(['pending', 'approved', 'rejected']).optional() })
  .refine((value) => Object.keys(value).length > 0, 'Provide a status or at least one field to update.');

const votePayloadSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)])
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

  if (req.method?.toUpperCase() === 'PUT') {
    return handleVote(req, res, submissionId);
  }

  if (req.method?.toUpperCase() === 'DELETE') {
    return handleDelete(req, res, submissionId);
  }

  return jsonError(res, 405, `Method ${req.method ?? 'UNKNOWN'} not allowed. Use PATCH, PUT or DELETE.`);
}

async function handleVote(req: VercelRequest, res: VercelResponse, submissionId: string) {
  try {
    const token = await verifyRequestToken(req);
    await assertActiveUser(token);
    const { value } = votePayloadSchema.parse(req.body ?? {});

    const submissions = await getSubmissionsCollection();
    const submission = await submissions.findOne({ _id: new ObjectId(submissionId) });
    if (!submission || submission.status !== 'approved') {
      return jsonError(res, 404, 'Published alternative not found.');
    }

    await setVote(submissionId, token.uid, value);
    const totals = (await getVoteTotals([submissionId])).get(submissionId) ?? EMPTY_TOTALS;

    return jsonOk(res, { id: submissionId, ...totals, myVote: value });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }
    if (error instanceof ZodError) {
      return jsonError(res, 400, 'Vote value must be 1, -1 or 0.');
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
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
    const { status, ...edits } = payload;

    const result = await submissions.findOneAndUpdate(
      { _id: new ObjectId(submissionId) },
      {
        $set: {
          ...edits,
          ...(status
            ? status === 'pending'
              ? { status, reviewedByUid: null, reviewedAt: null }
              : { status, reviewedByUid: admin.uid, reviewedAt: now }
            : {}),
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
    if (result.deletedCount > 0) {
      await (await getVotesCollection()).deleteMany({ submissionId });
    }

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