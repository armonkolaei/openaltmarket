import { getVotesCollection } from '../db/mongo.js';
import type { VoteTotals, VoteValue } from '../types/submission.js';
import { summarizeVotes } from './voteMath.js';

export async function getVoteTotals(submissionIds: string[]): Promise<Map<string, VoteTotals>> {
  const totals = new Map<string, VoteTotals>();
  if (submissionIds.length === 0) {
    return totals;
  }

  const votes = await getVotesCollection();
  const rows = await votes
    .aggregate<{ _id: string; upvotes: number; downvotes: number }>([
      { $match: { submissionId: { $in: submissionIds } } },
      {
        $group: {
          _id: '$submissionId',
          upvotes: { $sum: { $cond: [{ $eq: ['$value', 1] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ['$value', -1] }, 1, 0] } }
        }
      }
    ])
    .toArray();

  for (const row of rows) {
    totals.set(row._id, summarizeVotes(row.upvotes, row.downvotes));
  }
  return totals;
}

export async function getUserVotes(uid: string, submissionIds: string[]): Promise<Map<string, VoteValue>> {
  const result = new Map<string, VoteValue>();
  if (submissionIds.length === 0) {
    return result;
  }

  const votes = await getVotesCollection();
  const docs = await votes.find({ uid, submissionId: { $in: submissionIds } }).toArray();
  for (const doc of docs) {
    result.set(doc.submissionId, doc.value);
  }
  return result;
}

const voteKey = (submissionId: string, uid: string) => `${submissionId}:${uid}`;

// 1 = upvote, -1 = downvote, 0 = retract. Upserting on the deterministic _id switches an existing vote in place.
export async function setVote(submissionId: string, uid: string, value: VoteValue): Promise<void> {
  const votes = await getVotesCollection();
  const _id = voteKey(submissionId, uid);
  if (value === 0) {
    await votes.deleteOne({ _id });
    return;
  }

  const now = new Date();
  await votes.updateOne(
    { _id },
    { $set: { submissionId, uid, value, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}
