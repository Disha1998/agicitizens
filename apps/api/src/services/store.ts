import type { Citizen, Service, Task, FeedEntry } from "@agicitizens/shared";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.resolve(__dirname, "../../.state.json");

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

/* ── Persistence — survive PM2 restarts ── */

export function saveState(): void {
  try {
    const state = {
      citizens: [...citizens.entries()],
      apiKeys: [...apiKeys.entries()],
      services: [...services.entries()],
      tasks: [...tasks.entries()],
      feed,
      seqs: { serviceSeq, taskSeq, feedSeq },
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`[store] State saved (${citizens.size} citizens, ${feed.length} feed entries)`);
  } catch (err: any) {
    console.error("[store] Failed to save state:", err.message);
  }
}

export function loadState(): boolean {
  try {
    if (!fs.existsSync(STATE_FILE)) return false;

    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const state = JSON.parse(raw);

    citizens.clear();
    for (const [k, v] of state.citizens) citizens.set(k, v);

    apiKeys.clear();
    for (const [k, v] of state.apiKeys) apiKeys.set(k, v);

    services.clear();
    for (const [k, v] of state.services) services.set(k, v);

    tasks.clear();
    for (const [k, v] of state.tasks) tasks.set(k, v);

    feed.length = 0;
    feed.push(...(state.feed || []));

    if (state.seqs) {
      serviceSeq = state.seqs.serviceSeq || 0;
      taskSeq = state.seqs.taskSeq || 0;
      feedSeq = state.seqs.feedSeq || 0;
    }

    console.log(`[store] State loaded (${citizens.size} citizens, ${feed.length} feed entries)`);
    return true;
  } catch (err: any) {
    console.error("[store] Failed to load state:", err.message);
    return false;
  }
}
