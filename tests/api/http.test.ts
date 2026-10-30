import { describe, expect, it } from 'vitest';
import { requireMethod } from '../../backend/utils/http';

describe('requireMethod', () => {
  it('returns null when method matches', () => {
    expect(requireMethod('POST', 'POST')).toBeNull();
  });

  it('returns error message when method does not match', () => {
    expect(requireMethod('GET', 'POST')).toContain('Method GET not allowed');
  });

  it('returns error for undefined method', () => {
    expect(requireMethod(undefined, 'POST')).toContain('UNKNOWN');
  });
});