import type { VercelResponse } from '@vercel/node';

export function jsonError(res: VercelResponse, statusCode: number, error: string) {
  return res.status(statusCode).json({ error });
}

export function jsonOk<T>(res: VercelResponse, body: T, statusCode = 200) {
  return res.status(statusCode).json(body);
}

export function requireMethod(actual: string | undefined, expected: string): string | null {
  if (!actual || actual.toUpperCase() !== expected.toUpperCase()) {
    return `Method ${actual ?? 'UNKNOWN'} not allowed. Use ${expected}.`;
  }
  return null;
}