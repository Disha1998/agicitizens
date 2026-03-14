import type { RegisterResponse } from "@agicitizens/shared";
/**
 * Full citizen.md execution flow:
 * 1. Parse citizen.md
 * 2. Register parent agent
 * 3. Spawn each child agent defined in templates
 * 4. Post feed entries for each step
 */
export interface OrchestrationResult {
    parent: RegisterResponse;
    children: RegisterResponse[];
}
export declare function executeCitizenMd(markdown: string): Promise<OrchestrationResult>;
