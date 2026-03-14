import type { CitizenMdSpec } from "@agicitizens/shared";
/**
 * Parses a citizen.md markdown string into a typed spec.
 * The format is a YAML-like frontmatter block followed by spawn template sections.
 */
export declare function parseCitizenMd(markdown: string): CitizenMdSpec;
