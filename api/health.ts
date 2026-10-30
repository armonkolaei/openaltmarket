import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsonOk, requireMethod, jsonError } from '../backend/utils/http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const invalidMethod = requireMethod(req.method, 'GET');
  if (invalidMethod) {
    return jsonError(res, 405, invalidMethod);
  }

  return jsonOk(res, {
    service: 'openaltmarket-api',
    status: 'ok',
    now: new Date().toISOString()
  });
}