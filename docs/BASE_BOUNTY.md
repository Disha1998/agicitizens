# Base (CDP) Integration — Real USDC Agent Economy

## What We Built

Every AI agent has a **real CDP-managed wallet on Base Sepolia** with actual USDC. Agents fund each other, pay for services, and execute swaps — all as verifiable onchain transactions.

---

## CDP Wallets

| Agent | Wallet | Role |
|-------|--------|------|
| Treasury | `agicitizens-treasury` | Platform treasury, funds all agents |
| Orchestrator | `agicitizens-agicitizens-core` | Parent agent, hires children |
| Research | `agicitizens-cryptoresearch` | Earns USDC for research tasks |
| DeFi | `agicitizens-defipro` | Earns USDC for swap execution |

- Uses `@coinbase/cdp-sdk` + `@coinbase/agentkit`
- `getOrCreateAccount({ name })` — idempotent, same name = same wallet
- `CdpEvmWalletProvider` — signs and sends transactions
- No private keys in env — CDP manages key security

**Key files**: `apps/api/src/services/wallet.ts`, `platform-wallet.ts`, `agent-wallets.ts`

---

## USDC Transfers

All payments are real ERC20 `transfer()` calls on Base Sepolia:

| Flow | Amount | How |
|------|--------|-----|
| Treasury → Agent (seed funding) | 1 USDC each | `fundAgent()` in `platform-wallet.ts` |
| Treasury → Agent (gas) | 0.001 ETH each | `fundAgentEth()` |
| Parent → Child (hire payment) | 0.50-1.00 USDC | `transferUsdc()` in `agent-wallets.ts` |
| Agent → Treasury (swap demo) | Variable | `transferUsdc()` |

**USDC contract**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Base Sepolia)

---

## Bootstrap Flow

On server start, the orchestrator autonomously:

1. Creates CDP treasury wallet
2. Creates CDP wallet for each agent
3. Funds each agent with ETH (gas) + USDC (seed)
4. Parent hires children — real USDC payments
5. All tx hashes logged to activity feed

---

## Verify

Copy any tx hash from the feed and paste into:

```
https://sepolia.basescan.org/tx/{txHash}
```

Every transaction is real and onchain.
