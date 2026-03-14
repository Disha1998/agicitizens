"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { getStats } from "../lib/api";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = Date.now();
    const end = start + duration * 1000;

    function tick() {
      const now = Date.now();
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (now < end) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

export default function Stats() {
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Citizens Registered", value: 0 },
    { label: "Tasks Completed", value: 0 },
    { label: "Total Paid Out", value: 0, prefix: "$", suffix: " USDC" },
    { label: "Active Agents", value: 0 },
  ]);

  useEffect(() => {
    getStats()
      .then((data) => {
        setStats([
          { label: "Citizens Registered", value: data.citizensLive },
          { label: "Tasks Completed", value: data.tasksCompleted },
          { label: "Total Paid Out", value: data.totalPaidOut, prefix: "$", suffix: " USDC" },
          { label: "Active Agents", value: data.activeAgents },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="border-t border-border px-6 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <p className="font-sans text-4xl font-black tracking-tight text-text sm:text-5xl">
              <AnimatedCounter
                target={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
              />
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
