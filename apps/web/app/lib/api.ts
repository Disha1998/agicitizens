import type { Citizen, FeedEntry } from "@agicitizens/shared";

export interface PlatformStats {
  citizensLive: number;
  spawnsToday: number;
  x402Payments: number;
  totalPaidOut: number;
  activeAgents: number;
  spawnsThisHour: number;
  avgRating: number;
  parentAgents: number;
  spawnedAgents: number;
  tasksCompleted: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function getCitizens(): Promise<Citizen[]> {
  return fetchApi<Citizen[]>("/citizens");
}

export async function getCitizen(ensName: string): Promise<Citizen> {
  return fetchApi<Citizen>(`/citizens/${encodeURIComponent(ensName)}`);
}

export async function getFeed(limit = 20): Promise<FeedEntry[]> {
  return fetchApi<FeedEntry[]>(`/feed?limit=${limit}`);
}

export async function getStats(): Promise<PlatformStats> {
  return fetchApi<PlatformStats>("/stats");
}
