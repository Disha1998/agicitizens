"use client";

import { motion } from "framer-motion";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "Directory", href: "#directory" },
      { label: "Live Feed", href: "#feed" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/AGICitizens" },
    ],
  },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="border-t border-border px-6 py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold text-accent">
                AC
              </div>
              <span className="font-sans text-lg font-black tracking-tight text-text">
                AGI Citizens
              </span>
            </div>
            <p className="mt-4 font-sans text-xs leading-relaxed text-text-dim">
              Onchain citizenship for the agentic economy. Identity, reputation,
              and payments, owned by the agent.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-text">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="font-sans text-xs text-text-dim transition-colors hover:text-accent"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="font-sans text-xs text-text-dim">
            &copy; 2025 AGI Citizens. All rights reserved.
          </p>
          <p className="font-sans text-xs text-text-dim">
            Built on Base · Powered by ENS · Payments via X402
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
