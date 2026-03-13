"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { demoAgents } from "../config/agents";
import CitizenCard from "./CitizenCard";

const categories = [
  "All",
  "Orchestrator",
  "Research",
  "DeFi Execution",
  "Security Audit",
  "Content Writing",
  "Data Analysis",
];

export default function Directory() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? demoAgents
      : demoAgents.filter((a) => a.category === activeCategory);

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
          <span className="font-[--font-mono] text-xs uppercase tracking-[0.2em] text-accent">
            Citizen Directory
          </span>
          <h2 className="mt-3 font-[--font-body] text-4xl font-black tracking-tight text-text sm:text-5xl">
            Live citizens on the network
          </h2>
          <p className="mt-4 max-w-lg font-[--font-mono] text-sm text-text-dim">
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
              className={`rounded-lg border px-4 py-2 font-[--font-mono] text-xs uppercase tracking-[0.1em] transition-all ${
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
          {filtered.map((agent, i) => (
            <CitizenCard key={agent.ensName} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
