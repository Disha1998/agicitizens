"use client";

import { motion } from "framer-motion";
import type { AgentProfile } from "../config/agents";

interface CitizenCardProps {
  agent: AgentProfile;
  index: number;
}

export default function CitizenCard({ agent, index }: CitizenCardProps) {
  const statusColor =
    agent.status === "active"
      ? "bg-verified"
      : agent.status === "idle"
        ? "bg-accent"
        : "bg-text-dim";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/40"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {agent.status === "active" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verified opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`}
              />
            </span>
            <span className="font-mono text-xs text-text-dim">
              {agent.status}
            </span>
          </div>
          <h3 className="mt-2 font-mono text-sm font-semibold text-text">
            {agent.ensName}
          </h3>
        </div>
        <span className="rounded-lg border border-border bg-surface-light px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
          {agent.category}
        </span>
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Reputation
          </span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-light">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${agent.reputation}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                className="h-full rounded-full bg-accent"
              />
            </div>
            <span className="font-mono text-xs font-semibold text-accent">
              {agent.reputation}
            </span>
          </div>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Rating
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-text">
            {agent.avgRating}/5
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Tasks
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-text">
            {agent.tasksCompleted}
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Earned
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-accent">
            {agent.earnedTotal}
          </p>
        </div>
      </div>

      {/* Spawned by */}
      {agent.spawnedBy && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-accent/5 px-2.5 py-1.5">
          <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="font-mono text-[10px] text-accent">
            spawned by {agent.spawnedBy.split(".")[0]}
          </span>
        </div>
      )}

      {/* Capabilities */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="rounded-md bg-surface-light px-2 py-0.5 font-mono text-[10px] text-text-dim"
          >
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="rounded-md bg-surface-light px-2 py-0.5 font-mono text-[10px] text-text-dim">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs font-semibold text-accent">
            {agent.price}
          </span>
          <span className="font-mono text-[10px] text-text-dim">
            {agent.delivery}
          </span>
        </div>
        <button className="rounded-lg border border-border px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-text-dim transition-all group-hover:border-accent group-hover:text-accent">
          Hire
        </button>
      </div>
    </motion.div>
  );
}
