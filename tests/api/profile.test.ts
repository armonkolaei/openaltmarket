import { describe, expect, it } from 'vitest';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { buildUserProfile, parseProfilePatch, toUserProfileResponse } from '../../backend/users/profile';

describe('parseProfilePatch', () => {
  it('accepts valid payload', () => {
    const parsed = parseProfilePatch({
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.png'
    });

    expect(parsed.displayName).toBe('Test User');
  });

  it('rejects invalid email', () => {
    expect(() => parseProfilePatch({ email: 'invalid-email' })).toThrowError();
  });
});

describe('buildUserProfile', () => {
  it('uses token identity values over payload values', () => {
    const token = {
      uid: 'abc123',
      email: 'token@example.com',
      name: 'Token User',
      picture: 'https://example.com/token.png'
    } as unknown as DecodedIdToken;

    const profile = buildUserProfile(token, {
      displayName: 'Body User',
      email: 'body@example.com',
      photoURL: 'https://example.com/body.png'
    });

    expect(profile.uid).toBe('abc123');
    expect(profile.email).toBe('token@example.com');
    expect(profile.displayName).toBe('Token User');
    expect(profile.photoURL).toBe('https://example.com/token.png');
  });

  it('throws when email cannot be determined', () => {
    const token = {
      uid: 'abc123'
    } as unknown as DecodedIdToken;

    expect(() => buildUserProfile(token, {})).toThrowError();
  });
});

describe('toUserProfileResponse', () => {
  it('serializes dates as ISO strings', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const response = toUserProfileResponse({
      uid: 'u1',
      displayName: 'Demo',
      email: 'demo@example.com',
      photoURL: null,
      role: 'user',
      createdAt: now,
      lastLoginAt: now
    });

    expect(response.createdAt).toBe(now.toISOString());
    expect(response.lastLoginAt).toBe(now.toISOString());
  });
});