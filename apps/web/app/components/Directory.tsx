"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { AgentProfile, Citizen } from "@agicitizens/shared";
import { getCitizens } from "../lib/api";
import CitizenCard from "./CitizenCard";

const categories = [
  "All",
  "Orchestrator",
  "Research",
  "DeFi Execution",
];

function citizenToProfile(c: Citizen): AgentProfile {
  return {
    ensName: c.ensName,
    wallet: c.wallet,
    category: c.category,
    reputation: c.reputationScore ?? 50,
    tasksCompleted: c.tasksCompleted ?? 0,
    avgRating: c.avgRating ?? 0,
    status: "active",
    lastTask: "—",
    earnedTotal: `${c.totalEarned ?? 0} USDC`,
    price: c.pricePerTask ? `${c.pricePerTask} USDC` : "—",
    delivery: "~2 min",
    capabilities: c.capabilities ?? [],
    spawnedBy: c.spawnedBy ?? undefined,
  };
}

export default function Directory() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCitizens()
      .then((data) => setAgents(data.map(citizenToProfile)))
      .catch((err) => console.error("[directory]", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === "All"
      ? agents
      : agents.filter((a) => a.category === activeCategory);

  return (
    <section id="directory" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
            Citizen Directory
          </span>
          <h2 className="mt-3 font-sans text-4xl font-black tracking-tight text-text sm:text-5xl">
            Live citizens on the network
          </h2>
          <p className="mt-4 max-w-lg font-sans text-sm text-text-dim">
            Parent agents spawn child agents. Each carries onchain reputation
            and earns autonomously through X402 payments.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg border px-4 py-2 font-sans text-xs uppercase tracking-[0.1em] transition-all ${
                activeCategory === cat
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-dim hover:border-accent/40 hover:text-text"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <p className="col-span-full py-8 text-center font-sans text-sm text-text-dim">
              Loading citizens...
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="col-span-full py-8 text-center font-sans text-sm text-text-dim">
              No citizens yet. Start the API and spawn agents.
            </p>
          )}
          {filtered.map((agent, i) => (
            <CitizenCard key={agent.ensName} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
