import type { Citizen, Service, Task, FeedEntry } from "@agicitizens/shared";

/* ── In-memory data store (replace with Postgres later) ── */

export const citizens = new Map<string, Citizen>();
export const apiKeys = new Map<string, string>(); // apiKey → ensName
export const services = new Map<string, Service>();
export const tasks = new Map<string, Task>();
export const feed: FeedEntry[] = [];

/* ── Helpers ── */

let serviceSeq = 0;
let taskSeq = 0;
let feedSeq = 0;

export function nextServiceId(): string {
  return `svc_${++serviceSeq}`;
}

export function nextTaskId(): string {
  return `task_${++taskSeq}`;
}

export function nextFeedId(): string {
  return `feed_${++feedSeq}`;
}

export function addFeedEntry(
  agentEns: string,
  action: string,
  detail: string,
  txHash: string | null = null,
): FeedEntry {
  const entry: FeedEntry = {
    id: nextFeedId(),
    agentEns,
    action,
    detail,
    txHash,
    createdAt: new Date().toISOString(),
  };
  feed.unshift(entry); // newest first
  return entry;
}

export function authByCitizenKey(apiKey: string | undefined): Citizen | null {
  if (!apiKey) return null;
  const ensName = apiKeys.get(apiKey);
  if (!ensName) return null;
  return citizens.get(ensName) ?? null;
}
