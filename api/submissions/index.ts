import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Filter } from 'mongodb';
import { ZodError } from 'zod';
import { AuthError, verifyRequestToken } from '../../backend/auth/verifyToken.js';
import { assertActiveUser, getRequesterProfile, isAdminRole } from '../../backend/auth/authorization.js';
import { getSubmissionsCollection } from '../../backend/db/mongo.js';
import {
  buildSubmission,
  NO_GITHUB,
  parseSubmissionPayload,
  toPublicSubmissionResponse,
  toSubmissionResponse
} from '../../backend/submissions/submission.js';
import { GithubLookupError, verifyGithubUrl } from '../../backend/submissions/github.js';
import { getUserVotes, getVoteTotals } from '../../backend/submissions/votes.js';
import type { AppSubmission, VoteValue } from '../../backend/types/submission.js';
import { jsonError, jsonOk } from '../../backend/utils/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === 'POST') {
    return handleCreate(req, res);
  }

  if (req.method?.toUpperCase() === 'GET') {
    const status = Array.isArray(req.query?.status) ? req.query.status[0] : req.query?.status;
    return status === 'approved' ? handleListApproved(req, res) : handleListPending(req, res);
  }

  return jsonError(res, 405, `Method ${req.method ?? 'UNKNOWN'} not allowed. Use GET or POST.`);
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const token = await verifyRequestToken(req);
    await assertActiveUser(token);
    const email = token.email;
    if (!email) {
      return jsonError(res, 400, 'Authenticated user email is missing from Firebase token.');
    }

    const payload = parseSubmissionPayload(req.body ?? {});
    const github = payload.githubUrl ? await verifyGithubUrl(payload.githubUrl) : NO_GITHUB;

    const submissions = await getSubmissionsCollection();
    const created = buildSubmission(payload, token.uid, email, github);
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
    if (error instanceof GithubLookupError) {
      return jsonError(res, 400, error.message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}

async function handleListApproved(req: VercelRequest, res: VercelResponse) {
  try {
    const submissions = await getSubmissionsCollection();
    const docs = await submissions.find({ status: 'approved' }).sort({ updatedAt: -1 }).limit(500).toArray();
    const ids = docs.map((doc) => doc._id.toString());
    const totals = await getVoteTotals(ids);

    // Responses that include the caller's own vote must never be shared-cached.
    let myVotes = new Map<string, VoteValue>();
    if (req.headers.authorization) {
      const token = await verifyRequestToken(req).catch(() => null);
      if (token) {
        myVotes = await getUserVotes(token.uid, ids);
      }
      res.setHeader('Cache-Control', 'private, no-store');
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    }

    return jsonOk(res, {
      submissions: docs.map((doc) => {
        const id = doc._id.toString();
        return toPublicSubmissionResponse(doc, totals.get(id), myVotes.get(id) ?? 0);
      })
    });
  } catch (error) {
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

    const rawStatus = Array.isArray(req.query?.status) ? req.query.status[0] : req.query?.status;
    const status = rawStatus ?? 'pending';
    if (!['pending', 'approved', 'rejected', 'all'].includes(status)) {
      return jsonError(res, 400, 'Status must be pending, approved, rejected or all.');
    }

    const rawQuery = Array.isArray(req.query?.q) ? req.query.q[0] : req.query?.q;
    const search = (rawQuery ?? '').trim().slice(0, 100);

    const filter: Filter<AppSubmission> = {};
    if (status !== 'all') {
      filter.status = status as AppSubmission['status'];
    }
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: pattern },
        { description: pattern },
        { websiteUrl: pattern },
        { submittedByEmail: pattern },
        { alternativesTo: pattern },
        { keywords: pattern }
      ];
    }

    const submissions = await getSubmissionsCollection();
    const docs = await submissions.find(filter).sort({ createdAt: -1 }).limit(500).toArray();

    return jsonOk(res, { submissions: docs.map((doc) => toSubmissionResponse(doc)) });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(res, error.statusCode, error.message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonError(res, 500, message);
  }
}