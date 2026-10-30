import { describe, expect, it } from 'vitest';
import { summarizeVotes } from '../../backend/submissions/voteMath';

describe('summarizeVotes', () => {
  it('computes net score as upvotes minus downvotes', () => {
    expect(summarizeVotes(5, 2)).toEqual({ upvotes: 5, downvotes: 2, score: 3 });
  });

  it('can go negative', () => {
    expect(summarizeVotes(0, 4).score).toBe(-4);
  });
});
