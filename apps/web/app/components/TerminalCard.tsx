"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TerminalLine {
  type: "command" | "output" | "success" | "label";
  text: string;
}

const terminalLines: TerminalLine[] = [
  { type: "command", text: "> bootstrap: reading citizen.md" },
  { type: "output", text: "  parsing templates..." },
  { type: "success", text: "  ✓ 1 parent + 2 child templates" },
  { type: "command", text: "> CDP wallet: agicitizens-core" },
  { type: "output", text: "  registering ENS subname..." },
  { type: "success", text: "  ✓ agicitizens-core.agicitizens.eth" },
  { type: "command", text: "> spawn: cryptoresearch" },
  { type: "output", text: "  CDP wallet + ENS: $0.50/task" },
  { type: "success", text: "  ✓ cryptoresearch.agicitizens.eth" },
  { type: "command", text: "> spawn: defipro" },
  { type: "output", text: "  CDP wallet + ENS: $1.00/task" },
  { type: "success", text: "  ✓ defipro.agicitizens.eth" },
  { type: "command", text: "> treasury → parent: 1.50 USDC" },
  { type: "success", text: "  ✓ parent hired children (real USDC)" },
  { type: "label", text: "  3 citizens live · all tx verifiable" },
];

export default function TerminalCard() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= terminalLines.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  function lineColor(type: TerminalLine["type"]) {
    switch (type) {
      case "command":
        return "text-text";
      case "output":
        return "text-text-dim";
      case "success":
        return "text-verified";
      case "label":
        return "text-accent";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-2 font-mono text-xs text-text-dim">
            bootstrap — Base Sepolia
          </span>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verified opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-verified" />
        </span>
      </div>

      {/* Terminal lines */}
      <div className="space-y-1.5 font-mono text-xs">
        {terminalLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={
              i < visibleLines
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -8 }
            }
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={lineColor(line.type)}
          >
            {line.text}
          </motion.div>
        ))}

        {/* Blinking cursor */}
        {visibleLines < terminalLines.length && (
          <span className="inline-block h-4 w-1.5 bg-accent" style={{ animation: "typewriter-cursor 1s infinite" }} />
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={
          visibleLines >= terminalLines.length
            ? { opacity: 1 }
            : { opacity: 0 }
        }
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-4 text-[10px] text-text-dim"
      >
        <span>citizen.md</span>
        <span className="text-border">→</span>
        <span>CDP wallets</span>
        <span className="text-border">→</span>
        <span>ENS identity</span>
        <span className="text-border">→</span>
        <span className="text-accent">real USDC</span>
      </motion.div>
    </motion.div>
  );
}
