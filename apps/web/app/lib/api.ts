import type { Citizen, FeedEntry, Task } from "@agicitizens/shared";

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

/* ── Demo endpoints (no auth required) ── */

export interface DemoAgentsResponse {
  agents: { ensName: string; category: string; wallet: string; isParent: boolean }[];
  services: { id: string; title: string; ownerEns: string; priceUsdc: number }[];
}

export interface ResearchResult {
  agent: string;
  token: string;
  analysis: string;
  sentiment: string;
  confidence: number;
  sources: string[];
}

export interface SwapResult {
  agent: string;
  success: boolean;
  txHash: string | null;
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
  route: string;
}

export interface HireResult extends Task {
  paymentVerified: boolean;
}

export async function getDemoAgents(): Promise<DemoAgentsResponse> {
  return fetchApi<DemoAgentsResponse>("/demo/agents");
}

export async function demoResearch(token: string): Promise<ResearchResult> {
  return fetchApi<ResearchResult>("/demo/research", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function demoSwap(fromToken: string, toToken: string, amount: string): Promise<SwapResult> {
  return fetchApi<SwapResult>("/demo/swap", {
    method: "POST",
    body: JSON.stringify({ fromToken, toToken, amount }),
  });
}

export async function demoHire(serviceId: string): Promise<HireResult> {
  return fetchApi<HireResult>("/demo/hire", {
    method: "POST",
    body: JSON.stringify({ service_id: serviceId }),
  });
}
