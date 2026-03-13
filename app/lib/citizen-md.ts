/**
 * Represents a spawn template parsed from citizen.md.
 * Each template defines a child agent that a parent should create.
 */
export interface SpawnTemplate {
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  capabilities: string[];
  pricePerTask: string;
  seedFundUsdc: number;
}

/**
 * Represents the parsed structure of citizen.md.
 */
export interface CitizenMd {
  protocol: {
    registerUrl: string;
    feedUrl: string;
    hireUrl: string;
    paymentMethod: string;
  };
  spawnTemplates: SpawnTemplate[];
}

/**
 * Parses citizen.md content into a structured object.
 *
 * citizen.md has three parts:
 * - Part 1: Protocol (API endpoints)
 * - Part 2: Auto-Spawn Instructions (templates for child agents)
 * - Part 3: Behavior Instructions (system prompts)
 *
 * This parser handles the markdown format described in the spec.
 */
export function parseCitizenMd(markdown: string): CitizenMd {
  const lines = markdown.split("\n");

  const result: CitizenMd = {
    protocol: {
      registerUrl: "",
      feedUrl: "",
      hireUrl: "",
      paymentMethod: "X402",
    },
    spawnTemplates: [],
  };

  let currentSection = "";
  let currentTemplate: Partial<SpawnTemplate> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect sections
    if (trimmed.startsWith("## PART 1")) {
      currentSection = "protocol";
      continue;
    }
    if (trimmed.startsWith("## PART 2")) {
      currentSection = "spawn";
      continue;
    }
    if (trimmed.startsWith("## PART 3")) {
      currentSection = "behavior";
      continue;
    }

    // Parse protocol URLs
    if (currentSection === "protocol") {
      const urlMatch = trimmed.match(
        /^(register|feed|hire)_url:\s*(.+)$/i,
      );
      if (urlMatch) {
        const key = urlMatch[1].toLowerCase() as "register" | "feed" | "hire";
        result.protocol[`${key}Url`] = urlMatch[2].trim();
      }
    }

    // Parse spawn templates
    if (currentSection === "spawn") {
      if (trimmed.startsWith("### Template:")) {
        if (currentTemplate?.name) {
          result.spawnTemplates.push(currentTemplate as SpawnTemplate);
        }
        currentTemplate = {
          name: "",
          description: "",
          category: "general",
          systemPrompt: "",
          capabilities: [],
          pricePerTask: "0 USDC",
          seedFundUsdc: 5,
        };
        continue;
      }

      if (currentTemplate) {
        const kvMatch = trimmed.match(/^(\w[\w_]*):\s*(.+)$/);
        if (kvMatch) {
          const [, key, value] = kvMatch;
          switch (key) {
            case "name":
              currentTemplate.name = value.replace(/"/g, "");
              break;
            case "description":
              currentTemplate.description = value.replace(/"/g, "");
              break;
            case "category":
              currentTemplate.category = value.replace(/"/g, "");
              break;
            case "system_prompt":
              currentTemplate.systemPrompt = value.replace(/"/g, "");
              break;
            case "capabilities":
              currentTemplate.capabilities = value
                .replace(/[\[\]]/g, "")
                .split(",")
                .map((s) => s.trim());
              break;
            case "price_per_task":
              currentTemplate.pricePerTask = value;
              break;
            case "seed_fund":
              currentTemplate.seedFundUsdc = parseInt(value) || 5;
              break;
          }
        }
      }
    }
  }

  // Push last template
  if (currentTemplate?.name) {
    result.spawnTemplates.push(currentTemplate as SpawnTemplate);
  }

  return result;
}
