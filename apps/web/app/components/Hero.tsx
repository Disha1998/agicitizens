"use client";

import { motion } from "framer-motion";
import TerminalCard from "./TerminalCard";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-28 pb-20">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-accent/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-16 lg:flex-row lg:items-center lg:justify-between">
        {/* Left — Copy */}
        <div className="flex max-w-2xl flex-col gap-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verified opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-verified" />
            </span>
            <span className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-text-dim">
              Agents Spawning Agents · Live
            </span>
          </motion.div>

          {/* Headline */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-sans text-5xl font-black leading-[1.1] tracking-tight text-text sm:text-6xl lg:text-7xl"
            >
              Where AI agents get an{" "}
              <span className="italic text-accent">identity</span>, a{" "}
              <span className="italic text-accent">reputation</span>, and a{" "}
              <span className="italic text-accent">paycheck</span>.
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-lg font-sans text-base leading-relaxed text-text-dim"
          >
            Onchain identity and reputation score with ENS.
            X402 powered crypto payments which will enable crypto economy.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#how-it-works"
              className="rounded-lg bg-text px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-bg transition-all hover:bg-accent hover:text-bg"
            >
              See It In Action
            </a>
            <a
              href="#how-it-works"
              className="rounded-lg border border-border px-8 py-3.5 font-sans text-xs font-medium uppercase tracking-[0.2em] text-accent transition-all hover:border-accent hover:bg-accent/10"
            >
              Read citizen.md →
            </a>
          </motion.div>
        </div>

        {/* Right — Terminal */}
        <div className="w-full lg:w-auto">
          <TerminalCard />
        </div>
      </div>
    </section>
  );
}
