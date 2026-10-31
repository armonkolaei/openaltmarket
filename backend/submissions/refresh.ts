import { ObjectId } from 'mongodb';
import { getSubmissionsCollection } from '../db/mongo.js';
import { GithubLookupError, verifyGithubUrl } from './github.js';

export interface RefreshSummary {
  checked: number;
  updated: number;
  missing: number;
  stoppedEarly: boolean;
}

// Re-reads approved repositories, stalest snapshot first. Used by the cron job and the admin "refresh" button,
// so visitors never trigger server-side GitHub calls.
export async function refreshGithubSnapshots(options: { id?: string; limit?: number } = {}): Promise<RefreshSummary> {
  const submissions = await getSubmissionsCollection();
  const filter = options.id
    ? { _id: new ObjectId(options.id), status: 'approved' as const, githubUrl: { $ne: null } }
    : { status: 'approved' as const, githubUrl: { $ne: null } };

  const docs = await submissions
    .find(filter)
    .sort({ 'github.fetchedAt': 1 })
    .limit(options.limit ?? 20)
    .toArray();

  const summary: RefreshSummary = { checked: 0, updated: 0, missing: 0, stoppedEarly: false };

  for (const doc of docs) {
    if (!doc.githubUrl) continue;
    summary.checked += 1;
    try {
      const refreshed = await verifyGithubUrl(doc.githubUrl);
      if (!refreshed.github) {
        // GitHub is unavailable or rate limiting us; stop instead of burning the remaining budget.
        summary.stoppedEarly = true;
        break;
      }
      await submissions.updateOne(
        { _id: doc._id },
        { $set: { license: refreshed.license, licenseCheckedAt: refreshed.licenseCheckedAt, github: refreshed.github } }
      );
      summary.updated += 1;
    } catch (error) {
      if (error instanceof GithubLookupError && error.kind === 'not_found') {
        summary.missing += 1;
        continue;
      }
      summary.stoppedEarly = true;
      break;
    }
  }

  return summary;
}
