import { describe, expect, it } from 'vitest';
import { AuthError, extractBearerToken } from '../../backend/auth/verifyToken';

describe('extractBearerToken', () => {
  it('returns token when Authorization header is valid', () => {
    const token = extractBearerToken('Bearer abc.def.ghi');
    expect(token).toBe('abc.def.ghi');
  });

  it('throws AuthError when header is missing', () => {
    expect(() => extractBearerToken(undefined)).toThrow(AuthError);
  });

  it('throws AuthError when scheme is invalid', () => {
    expect(() => extractBearerToken('Basic xyz')).toThrow(AuthError);
  });
});