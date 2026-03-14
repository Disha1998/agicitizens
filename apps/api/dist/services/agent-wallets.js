/**
 * Runtime registry of agent wallet providers.
 *
 * The in-memory store only keeps string addresses, but to send
 * transactions from an agent's wallet we need the CDP provider
 * instance.  This module maps ensName → WalletInfo (with provider).
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
// ---- Registry ----
const agentWallets = new Map();
export function storeAgentWallet(ensName, wallet) {
    agentWallets.set(ensName, wallet);
    console.log(`[agent-wallets] Stored wallet for ${ensName} (provider: ${wallet.provider ? "CDP" : "mock"})`);
}
export function getAgentWallet(ensName) {
    return agentWallets.get(ensName);
}
// ---- USDC Transfer ----
/**
 * Send USDC from one registered agent to an address.
 * Returns the real tx hash (visible on basescan).
 */
export async function transferUsdc(fromEns, toAddress, amountUsdc) {
    const sender = agentWallets.get(fromEns);
    if (!sender)
        throw new Error(`No wallet provider for ${fromEns}`);
    if (!sender.provider)
        throw new Error(`${fromEns} has a mock wallet — cannot send real tx`);
    console.log(`[agent-wallets] Preparing USDC transfer: ${fromEns} → ${toAddress} (${amountUsdc} USDC)`);
    const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [toAddress, BigInt(Math.round(amountUsdc * 1_000_000))],
    });
    console.log(`[agent-wallets] Submitting tx to USDC contract ${USDC_ADDRESS}...`);
    const txHash = await sender.provider.sendTransaction({
        to: USDC_ADDRESS,
        data,
    });
    console.log(`[agent-wallets] Transfer complete!`);
    console.log(`[agent-wallets]   ${fromEns} → ${toAddress}`);
    console.log(`[agent-wallets]   Amount: ${amountUsdc} USDC`);
    console.log(`[agent-wallets]   tx: ${txHash}`);
    return txHash;
}
