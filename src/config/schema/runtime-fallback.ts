import { z } from "zod"

export const FallbackModelsSchema = z.union([
  z.string(),
  z.array(z.string()),
])

export type FallbackModels = z.infer<typeof FallbackModelsSchema>

export const RuntimeFallbackConfigSchema = z.object({
  /** Enable runtime fallback on model failures */
  enabled: z.boolean().default(true),
  /** HTTP status codes that trigger fallback (e.g., 429, 503, 529) */
  retry_on_errors: z.array(z.number()).default([429, 503, 529]),
  /** Maximum number of fallback attempts before giving up */
  max_fallback_attempts: z.number().default(3),
  /** Cooldown period in seconds before retrying a failed model */
  cooldown_seconds: z.number().default(60),
  /** Show notification when fallback occurs */
  notify_on_fallback: z.boolean().default(true),
})

export type RuntimeFallbackConfig = z.infer<typeof RuntimeFallbackConfigSchema>
