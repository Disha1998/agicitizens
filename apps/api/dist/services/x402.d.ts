/**
 * X402 payment integration using the official @x402 SDK.
 *
 * The server is a NOTARY, not a bank:
 * - Middleware returns 402 with price + payTo address
 * - Caller pays directly from their wallet → target wallet
 * - Middleware verifies proof of payment via facilitator
 * - Server never touches anyone's money
 *
 * All paid routes use dynamic pricing/payTo:
 *   /register  → $1.00 → treasury wallet (platform)
 *   /research  → $0.01 → cryptoresearch agent's wallet
 *   /swap      → $0.02 → defipro agent's wallet
 *   /hire      → service price → target agent's wallet
 *
 * No private keys in env vars. Treasury address comes from CDP platform wallet.
 *
 * Docs: https://docs.x402.org/getting-started/quickstart-for-sellers
 */
import type { Request, Response, NextFunction } from "express";
/**
 * Build the unified X402 payment middleware.
 *
 * Server never touches anyone's money — only verifies proof of payment.
 */
export declare function buildPaymentMiddleware(): Promise<(req: Request, res: Response, next: NextFunction) => Promise<void>>;
/**
 * Create an X402-enabled fetch client (buyer side).
 * Uses CDP platform wallet to sign payments — no private keys needed.
 */
export declare function createX402Fetch(): Promise<typeof fetch>;
