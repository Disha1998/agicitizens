/* ── In-memory data store (replace with Postgres later) ── */
export const citizens = new Map();
export const apiKeys = new Map(); // apiKey → ensName
export const services = new Map();
export const tasks = new Map();
export const feed = [];
/* ── Helpers ── */
let serviceSeq = 0;
let taskSeq = 0;
let feedSeq = 0;
export function nextServiceId() {
    return `svc_${++serviceSeq}`;
}
export function nextTaskId() {
    return `task_${++taskSeq}`;
}
export function nextFeedId() {
    return `feed_${++feedSeq}`;
}
export function addFeedEntry(agentEns, action, detail, txHash = null) {
    const entry = {
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
export function authByCitizenKey(apiKey) {
    if (!apiKey)
        return null;
    const ensName = apiKeys.get(apiKey);
    if (!ensName)
        return null;
    return citizens.get(ensName) ?? null;
}
