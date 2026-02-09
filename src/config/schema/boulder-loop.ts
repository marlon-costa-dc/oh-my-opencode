import { z } from "zod"

export const BoulderLoopConfigSchema = z.object({
  /** Enable boulder loop functionality (default: true) */
  enabled: z.boolean().default(true),
  /** Default hours if not specified in command (default: 4) */
  default_hours: z.number().min(1).max(24).default(4),
  /** Custom state file directory relative to project root */
  state_dir: z.string().optional(),
})

export type BoulderLoopConfig = z.infer<typeof BoulderLoopConfigSchema>
