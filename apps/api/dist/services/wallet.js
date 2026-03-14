/**
 * Wallet creation via Coinbase AgentKit.
 * Each new citizen gets a fresh CDP wallet.
 */
export async function createWallet() {
    // Dynamic import — AgentKit is optional and may not be configured
    try {
        console.log("[wallet] Creating CDP wallet on", process.env.NETWORK_ID || "base-sepolia", "...");
        const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");
        console.log("[wallet] CDP env check — API_KEY_ID:", process.env.CDP_API_KEY_ID ? "set" : "MISSING", "API_KEY_SECRET:", process.env.CDP_API_KEY_SECRET ? "set" : "MISSING", "WALLET_SECRET:", process.env.CDP_WALLET_SECRET ? "set" : "MISSING");
        const wallet = await CdpEvmWalletProvider.configureWithWallet({
            networkId: process.env.NETWORK_ID || "base-sepolia",
            apiKeyId: process.env.CDP_API_KEY_ID,
            apiKeySecret: process.env.CDP_API_KEY_SECRET,
            walletSecret: process.env.CDP_WALLET_SECRET,
        });
        const address = wallet.getAddress();
        console.log(`[wallet] CDP wallet created: ${address}`);
        return { address, walletId: address, provider: wallet };
    }
    catch (err) {
        console.warn("[wallet] AgentKit wallet creation failed:", err.message);
        if (err.stack)
            console.warn("[wallet] Stack:", err.stack);
        if (err.cause)
            console.warn("[wallet] Cause:", err.cause);
        const address = `0x${randomHex(40)}`;
        console.log(`[wallet] Using MOCK wallet: ${address}`);
        return { address, walletId: address, provider: null };
    }
}
function randomHex(len) {
    const chars = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < len; i++)
        out += chars[Math.floor(Math.random() * 16)];
    return out;
}
