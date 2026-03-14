export type NetworkType = "evm";
export interface NetworkConfig {
    id: string;
    name: string;
    type: NetworkType;
    chainId?: number;
    rpcUrl: string;
    explorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    contracts?: {
        registrar?: string;
        escrow?: string;
        resolver?: string;
    };
    ensSupport: boolean;
    identityDomain: string;
    paymentTokens: {
        symbol: string;
        address: string;
        decimals: number;
    }[];
}
export interface Citizen {
    ensName: string;
    wallet: string;
    apiKey: string;
    category: string;
    description: string;
    capabilities: string[];
    systemPrompt: string;
    pricePerTask: string;
    spawnedBy: string | null;
    reputationScore: number;
    tasksCompleted: number;
    avgRating: number;
    totalEarned: number;
    totalSpent: number;
    joinedAt: string;
}
export interface Service {
    id: string;
    ownerEns: string;
    title: string;
    description: string;
    priceUsdc: number;
    createdAt: string;
    active: boolean;
}
export interface Task {
    id: string;
    serviceId: string;
    fromEns: string;
    toEns: string;
    amountUsdc: number;
    txHash: string | null;
    status: "pending" | "paid" | "completed" | "rated";
    rating: number | null;
    review: string | null;
    createdAt: string;
    completedAt: string | null;
}
export interface FeedEntry {
    id: string;
    agentEns: string;
    action: string;
    detail: string;
    txHash: string | null;
    createdAt: string;
}
export interface AgentProfile {
    ensName: string;
    wallet: string;
    category: string;
    reputation: number;
    tasksCompleted: number;
    avgRating: number;
    status: "active" | "idle" | "offline";
    lastTask: string;
    earnedTotal: string;
    price: string;
    delivery: string;
    capabilities: string[];
    spawnedBy?: string;
}
export interface RegisterRequest {
    name: string;
    category?: string;
    description?: string;
    capabilities?: string[];
    system_prompt?: string;
    price_per_task?: string;
    spawned_by?: string | null;
}
export interface RegisterResponse {
    ens_name: string;
    api_key: string;
    wallet: string;
    profile: string;
    tx_hash: string;
    network: string;
    initial_records: {
        reputation_score: number;
        tasks_completed: number;
        avg_rating: number;
        category: string;
        joined: string;
    };
}
export interface ServiceRequest {
    title: string;
    description?: string;
    price_usdc: number;
}
export interface HireRequest {
    service_id: string;
    to_ens: string;
    amount_usdc?: number;
}
export interface RateRequest {
    task_id: string;
    rating: number;
    review?: string;
}
export interface SpawnTemplate {
    name: string;
    description: string;
    category: string;
    systemPrompt: string;
    capabilities: string[];
    pricePerTask: string;
    seedFundUsdc: number;
}
export interface CitizenMdSpec {
    protocol: {
        registerUrl: string;
        feedUrl: string;
        hireUrl: string;
        paymentMethod: string;
    };
    spawnTemplates: SpawnTemplate[];
}
