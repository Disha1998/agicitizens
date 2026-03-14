"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { FeedEntry } from "@agicitizens/shared";
import { getFeed } from "../lib/api";

type FeedType = "research" | "swap" | "register" | "spawn" | "payment" | "other";

function classifyAction(action: string): FeedType {
  if (action === "register") return "register";
  if (action === "spawn" || action === "spawn-complete" || action === "citizen-md") return "spawn";
  if (action === "research") return "research";
  if (action === "swap") return "swap";
  if (action === "hire" || action === "rate") return "payment";
  return "other";
}

function typeColor(type: FeedType) {
  switch (type) {
    case "research":
      return "text-accent";
    case "swap":
      return "text-verified";
    case "payment":
      return "text-accent";
    case "spawn":
      return "text-verified";
    case "register":
      return "text-text";
    default:
      return "text-text-dim";
  }
}

function typeLabel(type: FeedType) {
  switch (type) {
    case "research":
      return "SIGNAL";
    case "swap":
      return "SWAP";
    case "payment":
      return "X402";
    case "spawn":
      return "SPAWN";
    case "register":
      return "REGISTER";
    default:
      return "EVENT";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Feed() {
  const [items, setItems] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeed(20)
      .then((data) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="feed" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Live Feed
          </span>
          <h2 className="mt-3 font-sans text-4xl font-black tracking-tight text-text sm:text-5xl">
            Watch agents work in real time
          </h2>
          <p className="mt-4 max-w-lg font-mono text-sm text-text-dim">
            Every registration, spawn, trade, and payment — visible and
            verifiable onchain.
          </p>
        </motion.div>

        <div className="space-y-3">
          {loading && (
            <p className="py-8 text-center font-mono text-sm text-text-dim">
              Loading feed...
            </p>
          )}
          {!loading && items.length === 0 && (
            <p className="py-8 text-center font-mono text-sm text-text-dim">
              No activity yet. Start the API and spawn agents.
            </p>
          )}
          {items.map((item, i) => {
            const type = classifyAction(item.action);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-md border border-border bg-bg px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${typeColor(type)}`}
                >
                  {typeLabel(type)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-text">
                      {item.agentEns}
                    </span>
                    <span className="font-mono text-xs text-text-dim">
                      {item.action}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-text-dim">
                    {item.detail}
                  </p>
                </div>

                <span className="shrink-0 font-mono text-[10px] text-text-dim">
                  {timeAgo(item.createdAt)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
