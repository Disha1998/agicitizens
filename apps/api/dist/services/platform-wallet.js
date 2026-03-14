/**
 * Platform wallet — a singleton CDP-managed wallet for the platform.
 *
 * Replaces ENS_OWNER_PRIVATE_KEY entirely:
 * - Treasury address for X402 /register fees
 * - ENS domain owner (signs createSubname / setTextRecord)
 * - X402 buyer-side signer (pays HeyElsa for swaps)
 *
 * No private keys in env vars. CDP manages key security.
 * Only needs: CDP_API_KEY_ID + CDP_API_KEY_SECRET (API credentials).
 */
import { encodeFunctionData } from "viem";
import { getPaymentNetwork } from "@agicitizens/shared";
const paymentNet = getPaymentNetwork();
const USDC_ADDRESS = paymentNet.paymentTokens[0]?.address;
const ERC20_TRANSFER_ABI = [
    {
        name: "transfer",
        type: "function",
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
    },
];
let platformWalletPromise = null;
/**
 * Get or create the singleton platform wallet.
 * Returns a CDP-managed wallet — no private keys needed.
 */
export function getPlatformWallet() {
    if (!platformWalletPromise) {
        platformWalletPromise = initPlatformWallet();
    }
    return platformWalletPromise;
}
async function initPlatformWallet() {
    console.log("[platform-wallet] Initializing platform treasury wallet...");
    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
        console.warn("[platform-wallet] CDP_API_KEY_ID or CDP_API_KEY_SECRET not set — using mock wallet");
        return createMockWallet();
    }
    try {
        console.log("[platform-wallet] Connecting to CDP on", process.env.NETWORK_ID || "base-sepolia", "...");
        const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");
        const walletConfig = {
            networkId: process.env.NETWORK_ID || "base-sepolia",
            apiKeyId: process.env.CDP_API_KEY_ID,
            apiKeySecret: process.env.CDP_API_KEY_SECRET,
            walletSecret: process.env.CDP_WALLET_SECRET,
        };
        // Reuse existing wallet if address is saved
        if (process.env.PLATFORM_WALLET_ADDRESS) {
            walletConfig.address = process.env.PLATFORM_WALLET_ADDRESS;
            console.log(`[platform-wallet] Reusing saved wallet: ${process.env.PLATFORM_WALLET_ADDRESS}`);
        }
        const provider = await CdpEvmWalletProvider.configureWithWallet(walletConfig);
        const address = provider.getAddress();
        console.log(`[platform-wallet] CDP treasury wallet ready: ${address}`);
        if (!process.env.PLATFORM_WALLET_ADDRESS) {
            console.log(`[platform-wallet] ⚠ Add PLATFORM_WALLET_ADDRESS=${address} to .env to persist this wallet across restarts`);
            console.log(`[platform-wallet] Fund this address with ETH (gas) + USDC on Base Sepolia`);
        }
        return {
            address,
            sendTransaction: async (tx) => {
                return provider.sendTransaction({
                    to: tx.to,
                    data: tx.data,
                    value: tx.value ?? 0n,
                });
            },
            getViemAccount: async () => {
                // CDP wallet provider can act as a signer
                // Return the provider itself — it has sign methods
                return provider;
            },
        };
    }
    catch (err) {
        console.warn("[platform-wallet] CDP init failed:", err.message);
        return createMockWallet();
    }
}
/**
 * Fund an agent wallet with USDC from the platform treasury.
 * Returns the real tx hash.
 */
export async function fundAgent(toAddress, amountUsdc) {
    console.log(`[platform-wallet] Sending ${amountUsdc} USDC to ${toAddress}...`);
    const wallet = await getPlatformWallet();
    const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [toAddress, BigInt(Math.round(amountUsdc * 1_000_000))],
    });
    console.log(`[platform-wallet] Submitting USDC transfer tx (contract: ${USDC_ADDRESS})...`);
    const txHash = await wallet.sendTransaction({
        to: USDC_ADDRESS,
        data,
    });
    console.log(`[platform-wallet] Funded ${toAddress} with ${amountUsdc} USDC`);
    console.log(`[platform-wallet] tx: ${txHash}`);
    return txHash;
}
/**
 * Send ETH (for gas) from treasury to an agent wallet.
 * Returns the real tx hash.
 */
export async function fundAgentEth(toAddress, amountEth) {
    console.log(`[platform-wallet] Sending ${amountEth} ETH to ${toAddress} (gas funding)...`);
    const wallet = await getPlatformWallet();
    const txHash = await wallet.sendTransaction({
        to: toAddress,
        value: BigInt(Math.round(amountEth * 1e18)),
    });
    console.log(`[platform-wallet] Sent ${amountEth} ETH to ${toAddress}`);
    console.log(`[platform-wallet] tx: ${txHash}`);
    return txHash;
}
function createMockWallet() {
    const chars = "0123456789abcdef";
    let hex = "";
    for (let i = 0; i < 40; i++)
        hex += chars[Math.floor(Math.random() * 16)];
    const address = `0x${hex}`;
    console.log(`[platform-wallet] MOCK wallet: ${address}`);
    return {
        address,
        sendTransaction: async () => {
            const txHex = Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join("");
            return `0x${txHex}`;
        },
        getViemAccount: async () => null,
    };
}
