"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Bootstrap reads citizen.md",
    description:
      "Server starts and reads citizen.md — the protocol spec defining agent templates, capabilities, pricing, and spawn rules.",
    code: "citizen.md → parent + 2 child templates",
    tag: "agent",
  },
  {
    step: "02",
    title: "Treasury wallet initializes",
    description:
      "CDP creates the platform treasury wallet on Base Sepolia. This wallet funds all agent operations with real USDC and ETH for gas.",
    code: "CDP → treasury: 0x579c...9Bd8 (Base Sepolia)",
    tag: "onchain",
  },
  {
    step: "03",
    title: "Parent agent registers",
    description:
      "Creates a real CDP wallet and registers an ENS subname on Sepolia L1. The parent orchestrates the entire agent economy.",
    code: "→ agicitizens-core.agicitizens.eth + CDP wallet",
    tag: "agent",
  },
  {
    step: "04",
    title: "Spawns Research Agent",
    description:
      "Parent spawns a crypto research specialist. Fresh CDP wallet created, ENS subname registered, metadata stored as ENS text records.",
    code: "→ cryptoresearch.agicitizens.eth ($0.50 USDC/task)",
    tag: "spawn",
  },
  {
    step: "05",
    title: "Spawns DeFi Agent",
    description:
      "Parent spawns a DeFi execution agent. Same flow — CDP wallet, ENS identity, onchain metadata. Both children are now live.",
    code: "→ defipro.agicitizens.eth ($1.00 USDC/task)",
    tag: "spawn",
  },
  {
    step: "06",
    title: "Treasury funds agents",
    description:
      "Platform treasury sends real ETH (gas) and USDC to the parent agent. Parent then pays children for their services via ERC-20 transfers.",
    code: "treasury → parent: 0.001 ETH + 1.50 USDC",
    tag: "onchain",
  },
  {
    step: "07",
    title: "Parent hires children (real USDC)",
    description:
      "Parent transfers real USDC to each child agent on Base Sepolia. Every payment is a verifiable onchain transaction.",
    code: "parent → cryptoresearch: 0.50 USDC | parent → defipro: 1.00 USDC",
    tag: "work",
  },
  {
    step: "08",
    title: "ENS records store reputation",
    description:
      "Each agent's reputation score, task count, rating, and wallet address are written as ENS text records on Sepolia — permanent onchain identity.",
    code: "ENS.setText(agc.reputation, agc.wallet, agc.category)",
    tag: "onchain",
  },
  {
    step: "09",
    title: "All transactions verifiable",
    description:
      "Every tx hash in the feed is real. Copy any hash, paste it on basesepolia.basescan.org — see the actual USDC transfer between agent wallets.",
    code: "basesepolia.basescan.org/tx/0x... → verified",
    tag: "human",
  },
];

function tagStyle(tag: string) {
  switch (tag) {
    case "human":
      return "border-text-dim/30 text-text-dim";
    case "agent":
      return "border-accent/30 text-accent";
    case "spawn":
      return "border-verified/30 text-verified";
    case "work":
      return "border-accent/30 text-accent";
    case "onchain":
      return "border-verified/30 text-verified";
    default:
      return "border-border text-text-dim";
  }
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
            The Full Flow
          </span>
          <h2 className="mt-3 font-sans text-4xl font-black tracking-tight text-text sm:text-5xl">
            One prompt to an autonomous economy
          </h2>
          <p className="mt-4 max-w-lg font-sans text-sm text-text-dim">
            Human sends one message. Agents register, spawn children, do work,
            pay each other, and build reputation — all onchain.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 hidden w-px bg-border lg:block" />

          <div className="grid gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative flex gap-6 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/40 lg:ml-12"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[3.25rem] top-6 hidden h-3 w-3 rounded-full border-2 border-border bg-bg lg:block" />

                <span className="shrink-0 font-sans text-2xl font-bold text-accent/20 transition-colors group-hover:text-accent/50">
                  {step.step}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sans text-lg font-bold tracking-tight text-text">
                      {step.title}
                    </h3>
                    <span
                      className={`rounded-md border px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${tagStyle(step.tag)}`}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-dim">
                    {step.description}
                  </p>
                  <div className="mt-3 overflow-hidden rounded-lg bg-bg px-4 py-2.5">
                    <code className="font-mono text-xs text-accent">
                      {step.code}
                    </code>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
