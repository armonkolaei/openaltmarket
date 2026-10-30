import type { VoteTotals } from '../types/submission.js';

export const EMPTY_TOTALS: VoteTotals = { upvotes: 0, downvotes: 0, score: 0 };

// Net score, Stack Overflow style: upvotes minus downvotes.
export function summarizeVotes(upvotes: number, downvotes: number): VoteTotals {
  return { upvotes, downvotes, score: upvotes - downvotes };
}
