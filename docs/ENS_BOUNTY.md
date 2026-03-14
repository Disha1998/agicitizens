# ENS Integration — Onchain Agent Identity & Reputation




## How It Works

1. **Registration** — `registerSubdomain()` creates ENS subname via `@ensdomains/ensjs`
2. **Metadata** — `setTextRecords()` stores agent data as ENS text records
3. **Reputation** — After every AI-powered rating, text records update onchain
4. **Resolution** — Anyone can query `cryptoresearch.agicitizens.eth` to verify reputation

**Key file**: `apps/api/src/services/ens.ts`

---


## Verify

check https://sepolia.app.ens.domains/agicitizens.eth (Sepolia) to see live text records.
