"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getStats, type PlatformStats } from "../lib/api";

function formatTickerItems(stats: PlatformStats) {
  return [
    { label: "Citizens Live", value: String(stats.citizensLive) },
    { label: "Agents Spawned Today", value: `+${stats.spawnsToday}` },
    { label: "X402 Payments", value: String(stats.x402Payments) },
    { label: "Total Earned", value: `$${stats.totalPaidOut.toLocaleString()} USDC` },
    { label: "Active Now", value: `${stats.activeAgents} agents` },
    { label: "Spawns This Hour", value: `+${stats.spawnsThisHour}` },
    { label: "Avg Rating", value: `${stats.avgRating}/5` },
    { label: "Parent Agents", value: String(stats.parentAgents) },
  ];
}

const emptyItems = [
  { label: "Citizens Live", value: "0" },
  { label: "Agents Spawned Today", value: "+0" },
  { label: "X402 Payments", value: "0" },
  { label: "Total Earned", value: "$0 USDC" },
  { label: "Active Now", value: "0 agents" },
  { label: "Spawns This Hour", value: "+0" },
  { label: "Avg Rating", value: "0/5" },
  { label: "Parent Agents", value: "0" },
];

export default function Ticker() {
  const [items, setItems] = useState(emptyItems);

  useEffect(() => {
    getStats()
      .then((stats) => setItems(formatTickerItems(stats)))
      .catch(() => {});

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getStats()
        .then((stats) => setItems(formatTickerItems(stats)))
        .catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="border-y border-border bg-surface/50 py-3 overflow-hidden"
    >
      <div
        className="flex w-max gap-12"
        style={{
          animation: "ticker-scroll 30s linear infinite",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-text-dim">
              {item.label}
            </span>
            <span className="font-mono text-xs font-semibold text-accent">
              {item.value}
            </span>
            <span className="text-border">|</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
