"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getDemoAgents,
  demoResearch,
  demoSwap,
  demoHire,
  type DemoAgentsResponse,
  type ResearchResult,
  type SwapResult,
  type HireResult,
} from "../lib/api";

type ActionState = "idle" | "loading" | "done" | "error";

interface ActionResult {
  state: ActionState;
  data?: ResearchResult | SwapResult | HireResult;
  error?: string;
}

const BASESCAN = "https://sepolia.basescan.org/tx/";

export default function TryIt() {
  const [agents, setAgents] = useState<DemoAgentsResponse | null>(null);
  const [research, setResearch] = useState<ActionResult>({ state: "idle" });
  const [swap, setSwap] = useState<ActionResult>({ state: "idle" });
  const [hire, setHire] = useState<ActionResult>({ state: "idle" });

  useEffect(() => {
    getDemoAgents()
      .then(setAgents)
      .catch((err) => console.error("[try-it]", err));
  }, []);

  const researchAgent = agents?.agents.find((a) => a.category === "Research");
  const defiAgent = agents?.agents.find((a) => a.category === "DeFi Execution");
  const firstService = agents?.services[0];

  async function handleResearch() {
    setResearch({ state: "loading" });
    try {
      const data = await demoResearch("ETH");
      setResearch({ state: "done", data });
    } catch (err: any) {
      setResearch({ state: "error", error: err.message });
    }
  }

  async function handleSwap() {
    setSwap({ state: "loading" });
    try {
      const data = await demoSwap("USDC", "ETH", "0.50");
      setSwap({ state: "done", data });
    } catch (err: any) {
      setSwap({ state: "error", error: err.message });
    }
  }

  async function handleHire() {
    if (!firstService) return;
    setHire({ state: "loading" });
    try {
      const data = await demoHire(firstService.id);
      setHire({ state: "done", data });
    } catch (err: any) {
      setHire({ state: "error", error: err.message });
    }
  }

  return (
    <section id="try-it" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
            Interactive Demo
          </span>
          <h2 className="mt-3 font-sans text-4xl font-black tracking-tight text-text sm:text-5xl">
            Try it live
          </h2>
          <p className="mt-4 max-w-lg font-sans text-sm text-text-dim">
            Trigger real agent actions on Base Sepolia. Every result generates a
            verifiable onchain transaction.
          </p>
        </motion.div>

        {/* Action cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* ── Run Research ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col rounded-2xl border border-border bg-surface p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-lg">
                📊
              </span>
              <div>
                <h3 className="font-sans text-sm font-bold text-text">
                  Run Research
                </h3>
                <p className="font-sans text-xs text-text-dim">
                  {researchAgent?.ensName ?? "research agent"} · Claude AI
                </p>
              </div>
            </div>
            <p className="mb-6 flex-1 font-sans text-xs leading-relaxed text-text-dim">
              Ask the research agent to analyze ETH using Claude API. Returns
              sentiment, confidence score, and analysis.
            </p>

            <button
              onClick={handleResearch}
              disabled={research.state === "loading"}
              className="w-full rounded-lg bg-text px-4 py-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-bg transition-all hover:bg-accent disabled:opacity-50"
            >
              {research.state === "loading" ? "Analyzing..." : "Analyze ETH"}
            </button>

            {/* Result */}
            {research.state === "done" && research.data && (
              <ResultCard>
                <ResultRow label="Agent" value={(research.data as ResearchResult).agent} />
                <ResultRow label="Sentiment" value={(research.data as ResearchResult).sentiment} highlight />
                <ResultRow label="Confidence" value={`${(research.data as ResearchResult).confidence}%`} />
                <p className="mt-2 font-sans text-[11px] leading-relaxed text-text-dim">
                  {(research.data as ResearchResult).analysis?.slice(0, 200)}...
                </p>
                {(research.data as any).txHash && (
                  <TxLink hash={(research.data as any).txHash} />
                )}
              </ResultCard>
            )}
            {research.state === "error" && (
              <ErrorCard message={research.error!} />
            )}
          </motion.div>

          {/* ── Execute Swap ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col rounded-2xl border border-border bg-surface p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-verified/10 text-lg">
                🔄
              </span>
              <div>
                <h3 className="font-sans text-sm font-bold text-text">
                  Execute Swap
                </h3>
                <p className="font-sans text-xs text-text-dim">
                  {defiAgent?.ensName ?? "defi agent"} · Base Sepolia
                </p>
              </div>
            </div>
            <p className="mb-6 flex-1 font-sans text-xs leading-relaxed text-text-dim">
              The DeFi agent executes a real USDC transfer on Base Sepolia.
              Every transaction is verifiable onchain.
            </p>

            <button
              onClick={handleSwap}
              disabled={swap.state === "loading"}
              className="w-full rounded-lg bg-text px-4 py-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-bg transition-all hover:bg-accent disabled:opacity-50"
            >
              {swap.state === "loading" ? "Swapping..." : "Swap 0.50 USDC → ETH"}
            </button>

            {/* Result */}
            {swap.state === "done" && swap.data && (
              <ResultCard>
                <ResultRow label="Agent" value={(swap.data as SwapResult).agent} />
                <ResultRow label="Route" value={(swap.data as SwapResult).route} />
                <ResultRow
                  label="Amount"
                  value={`${(swap.data as SwapResult).amountIn} → ${(swap.data as SwapResult).amountOut}`}
                />
                {(swap.data as SwapResult).txHash && (
                  <TxLink hash={(swap.data as SwapResult).txHash!} />
                )}
              </ResultCard>
            )}
            {swap.state === "error" && (
              <ErrorCard message={swap.error!} />
            )}
          </motion.div>

          {/* ── Hire Agent ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col rounded-2xl border border-border bg-surface p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-lg">
                💰
              </span>
              <div>
                <h3 className="font-sans text-sm font-bold text-text">
                  Hire Agent
                </h3>
                <p className="font-sans text-xs text-text-dim">
                  {firstService
                    ? `${firstService.ownerEns} · $${firstService.priceUsdc} USDC`
                    : "loading..."}
                </p>
              </div>
            </div>
            <p className="mb-6 flex-1 font-sans text-xs leading-relaxed text-text-dim">
              Parent agent hires a child agent and pays with real USDC on Base
              Sepolia. Verifiable peer-to-peer payment.
            </p>

            <button
              onClick={handleHire}
              disabled={hire.state === "loading" || !firstService}
              className="w-full rounded-lg bg-text px-4 py-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-bg transition-all hover:bg-accent disabled:opacity-50"
            >
              {hire.state === "loading"
                ? "Hiring..."
                : firstService
                  ? `Hire for ${firstService.priceUsdc} USDC`
                  : "Loading..."}
            </button>

            {/* Result */}
            {hire.state === "done" && hire.data && (
              <ResultCard>
                <ResultRow label="From" value={(hire.data as HireResult).fromEns} />
                <ResultRow label="To" value={(hire.data as HireResult).toEns} />
                <ResultRow
                  label="Amount"
                  value={`${(hire.data as HireResult).amountUsdc} USDC`}
                  highlight
                />
                <ResultRow
                  label="Status"
                  value={(hire.data as HireResult).paymentVerified ? "Paid ✓" : "Pending"}
                />
                {(hire.data as HireResult).txHash && (
                  <TxLink hash={(hire.data as HireResult).txHash!} />
                )}
              </ResultCard>
            )}
            {hire.state === "error" && (
              <ErrorCard message={hire.error!} />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ── */

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 rounded-lg border border-border bg-bg p-4 space-y-2"
    >
      {children}
    </motion.div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-sans text-[11px] uppercase tracking-wider text-text-dim">
        {label}
      </span>
      <span
        className={`font-mono text-xs truncate max-w-[200px] ${highlight ? "text-accent font-semibold" : "text-text"}`}
      >
        {value}
      </span>
    </div>
  );
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`${BASESCAN}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 block truncate font-mono text-[10px] text-accent underline decoration-accent/30 hover:decoration-accent"
    >
      View on BaseScan →
    </a>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
      <p className="font-sans text-xs text-red-400">{message}</p>
    </div>
  );
}
