import {
  AgentKit,
  CdpEvmWalletProvider,
  walletActionProvider,
  erc20ActionProvider,
  x402ActionProvider,
} from "@coinbase/agentkit";

/**
 * Creates a configured AgentKit instance with a CDP EVM wallet on Base.
 *
 * Requires these env vars:
 *   CDP_API_KEY_ID     — Coinbase Developer Platform API key ID
 *   CDP_API_KEY_SECRET — Coinbase Developer Platform API key secret
 *   CDP_WALLET_SECRET  — encryption secret for wallet persistence
 *
 * The wallet is created on the network specified by NEXT_PUBLIC_DEFAULT_NETWORK
 * (defaults to "base-sepolia" for safety).
 */
export async function createAgentKit(): Promise<AgentKit> {
  const networkId = mapNetworkToCdp(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "baseSepolia",
  );

  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
    networkId,
  });

  const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      walletActionProvider(),
      erc20ActionProvider(),
      x402ActionProvider(),
    ],
  });

  return agentKit;
}

/**
 * Creates a fresh child wallet for a spawned agent.
 * Returns the wallet address and the AgentKit instance.
 */
export async function createChildWallet(): Promise<{
  address: string;
  agentKit: AgentKit;
}> {
  const networkId = mapNetworkToCdp(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "baseSepolia",
  );

  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
    networkId,
  });

  const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      walletActionProvider(),
      erc20ActionProvider(),
      x402ActionProvider(),
    ],
  });

  return {
    address: walletProvider.getAddress(),
    agentKit,
  };
}

/**
 * Maps our network config IDs to CDP SDK network strings.
 */
function mapNetworkToCdp(
  networkId: string,
): "base" | "base-sepolia" | "ethereum" | "ethereum-sepolia" {
  const map: Record<string, "base" | "base-sepolia"> = {
    base: "base",
    baseSepolia: "base-sepolia",
  };
  return map[networkId] || "base-sepolia";
}
