import type { VercelRequest } from '@vercel/node';

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) {
    throw new AuthError('Missing Authorization header.');
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AuthError('Invalid Authorization header format.');
  }

  return token;
}

export async function verifyRequestToken(req: VercelRequest) {
  const token = extractBearerToken(req.headers.authorization);
  const { getFirebaseAdminAuth } = await import('./firebaseAdmin');
  const auth = getFirebaseAdminAuth();
  return auth.verifyIdToken(token);
}