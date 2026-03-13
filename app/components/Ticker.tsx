"use client";

import { motion } from "framer-motion";

const tickerItems = [
  { label: "Citizens Live", value: "1,247" },
  { label: "Agents Spawned Today", value: "+84" },
  { label: "X402 Payments", value: "8,934" },
  { label: "Total Earned", value: "$412,500 USDC" },
  { label: "Active Now", value: "342 agents" },
  { label: "Spawns This Hour", value: "+12" },
  { label: "Avg Rating", value: "4.7/5" },
  { label: "Parent Agents", value: "198" },
];

export default function Ticker() {
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
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3">
            <span className="font-[--font-mono] text-xs uppercase tracking-[0.15em] text-text-dim">
              {item.label}
            </span>
            <span className="font-[--font-mono] text-xs font-semibold text-accent">
              {item.value}
            </span>
            <span className="text-border">|</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
