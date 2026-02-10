<<<<<<< HEAD
=======
import type { AgentConfig } from "@opencode-ai/sdk"
import { sisyphusAgent } from "./sisyphus"
import { oracleAgent } from "./oracle"
import { librarianAgent } from "./librarian"
import { exploreAgent } from "./explore"
import { frontendUiUxEngineerAgent } from "./frontend-ui-ux-engineer"
import { documentWriterAgent } from "./document-writer"
import { multimodalLookerAgent } from "./multimodal-looker"
import { metisAgent } from "./metis"
import { orchestratorSisyphusAgent } from "./orchestrator-sisyphus"
import { momusAgent } from "./momus"
import { walleResearcherAgent } from "./walle-researcher"

export const builtinAgents: Record<string, AgentConfig> = {
  Sisyphus: sisyphusAgent,
  oracle: oracleAgent,
  librarian: librarianAgent,
  explore: exploreAgent,
  "frontend-ui-ux-engineer": frontendUiUxEngineerAgent,
  "document-writer": documentWriterAgent,
  "multimodal-looker": multimodalLookerAgent,
  "Metis (Plan Consultant)": metisAgent,
  "Momus (Plan Reviewer)": momusAgent,
  "orchestrator-sisyphus": orchestratorSisyphusAgent,
  "Walle-Researcher": walleResearcherAgent,
}

>>>>>>> ruslan-kurchenko/personal
export * from "./types"
export { createBuiltinAgents } from "./builtin-agents"
export type { AvailableAgent, AvailableCategory, AvailableSkill } from "./dynamic-agent-prompt-builder"
export { createSisyphusAgent } from "./sisyphus"
export { createOracleAgent, ORACLE_PROMPT_METADATA } from "./oracle"
export { createLibrarianAgent, LIBRARIAN_PROMPT_METADATA } from "./librarian"
export { createExploreAgent, EXPLORE_PROMPT_METADATA } from "./explore"


export { createMultimodalLookerAgent, MULTIMODAL_LOOKER_PROMPT_METADATA } from "./multimodal-looker"
export { createDevilsAdvocateAgent, DEVILS_ADVOCATE_PROMPT_METADATA } from "./devils-advocate"
export { createMetisAgent, METIS_SYSTEM_PROMPT, metisPromptMetadata } from "./metis"
export { createMomusAgent, MOMUS_SYSTEM_PROMPT, momusPromptMetadata } from "./momus"
export { createAtlasAgent, atlasPromptMetadata } from "./atlas"
export {
  PROMETHEUS_SYSTEM_PROMPT,
  PROMETHEUS_PERMISSION,
  PROMETHEUS_IDENTITY_CONSTRAINTS,
  PROMETHEUS_INTERVIEW_MODE,
  PROMETHEUS_PLAN_GENERATION,
  PROMETHEUS_HIGH_ACCURACY_MODE,
  PROMETHEUS_PLAN_TEMPLATE,
  PROMETHEUS_BEHAVIORAL_SUMMARY,
} from "./prometheus"
