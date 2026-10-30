import { MongoClient, type Collection } from 'mongodb';
import { env } from '../utils/env.js';
import type { UserProfile } from '../types/user.js';
import type { AppSubmission, SubmissionVote } from '../types/submission.js';

declare global {
  // eslint-disable-next-line no-var
  var __openAltMongoClient: MongoClient | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

function createClient() {
  const client = new MongoClient(env.mongodbUri);

  return client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  if (globalThis.__openAltMongoClient) {
    return globalThis.__openAltMongoClient;
  }

  if (!clientPromise) {
    clientPromise = createClient();
  }

  const client = await clientPromise;
  globalThis.__openAltMongoClient = client;
  return client;
}

export async function getUsersCollection(): Promise<Collection<UserProfile>> {
  const client = await getMongoClient();
  return client.db(env.mongodbDbName).collection<UserProfile>('users');
}

export async function getSubmissionsCollection(): Promise<Collection<AppSubmission>> {
  const client = await getMongoClient();
  return client.db(env.mongodbDbName).collection<AppSubmission>('submissions');
}

export async function getVotesCollection(): Promise<Collection<SubmissionVote>> {
  const client = await getMongoClient();
  return client.db(env.mongodbDbName).collection<SubmissionVote>('votes');
}