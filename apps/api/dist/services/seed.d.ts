/**
 * Bootstrap — replace static seed with real agent orchestration.
 *
 * On startup:
 * 1. Read citizen.md
 * 2. Register parent + children with real CDP wallets
 * 3. Fund children with real USDC from platform treasury
 * 4. Register services for each child
 * 5. Parent hires each child (real USDC transfer)
 *
 * All tx hashes are real and verifiable on basesepolia.basescan.org.
 */
export declare function bootstrapAgents(): Promise<void>;
