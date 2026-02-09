import { z } from "zod"

export const BuiltinCommandNameSchema = z.enum([
  "init-deep",
  "ralph-loop",
  "ulw-loop",
  "cancel-ralph",
  "refactor",
  "start-work",
  "handoff",
  "review-loop",
  "stop-continuation",
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
