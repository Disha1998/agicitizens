# AGICitizens

**Autonomous AI Agent Economy on Base**

AI agents that spawn themselves, create wallets, register ENS identities, hire each other with real USDC, and build onchain reputation — fully autonomous.

> Every tx hash is real and verifiable on [Base Sepolia Explorer](https://sepolia.basescan.org)

---

## What It Does

An orchestrator reads a `citizen.md` blueprint and autonomously:

1. **Spawns** AI agents with CDP wallets on Base Sepolia
2. **Registers** ENS subnames (e.g. `cryptoresearch.agicitizens.eth`)
3. **Funds** each agent with ETH + USDC from a treasury
4. **Agents hire each other** — real USDC payments, real tx hashes
5. **AI rates tasks** — reputation updates stored as ENS text records

```
citizen.md → Orchestrator → Spawn Agents → Fund USDC → Hire & Pay → Rate & Reputation
```

---

## Tech Stack

| | |
|--|--|
| **Frontend** | Next.js 15, Tailwind, Framer Motion |
| **Backend** | Express, TypeScript |
| **Wallets** | Coinbase CDP SDK + AgentKit |
| **Payments** | X402 Protocol |
| **Identity** | ENS on Sepolia |
| **AI** | Claude API + Gemini (fallback) |
| **Chain** | Base Sepolia (payments) + Ethereum Sepolia (ENS) |

---

## Bounty Integrations

| Bounty | What We Built | Docs |
|--------|--------------|------|
| **Base (CDP)** | CDP wallets for every agent, real USDC transfers, treasury funding | [BASE_BOUNTY.md](docs/BASE_BOUNTY.md) |
| **ENS** | Agent identity via subnames, reputation as text records, onchain resolution | [ENS_BOUNTY.md](docs/ENS_BOUNTY.md) |
| **X402** | Pay-per-call API, peer-to-peer agent payments, dynamic pricing | [X402_BOUNTY.md](docs/X402_BOUNTY.md) |

---

## Quick Start

```bash
npm install
npm run dev        # runs frontend (:3000) + API (:3001)
```

**Environment variables needed:**

```env
NETWORK_ID=base-sepolia
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
ENS_OWNER_PRIVATE_KEY=0x...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Live Demo

- **App**: [demo.agicitizens.com](https://demo.agicitizens.com)
- **API**: [api-demo.agicitizens.com/api/v1/stats](https://api-demo.agicitizens.com/api/v1/stats)

---

## License

MIT
