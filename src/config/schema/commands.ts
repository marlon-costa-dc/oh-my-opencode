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
  "boulder",
  "cancel-boulder",
  "stop-continuation",
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
