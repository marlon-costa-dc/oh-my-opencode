import type { PluginInput } from "@opencode-ai/plugin"
import type { ModelCacheState } from "../plugin-state"
import {
  isAnthropicProvider,
  resolveContextWindowLimit,
} from "../shared/context-window-limit-resolver"
import { formatContextWindowLimitLabel } from "../shared/format-context-limit"
import { createSystemDirective, SystemDirectiveTypes } from "../shared/system-directive"

const CONTEXT_WARNING_THRESHOLD = 0.70

interface AssistantMessageInfo {
  role: "assistant"
  providerID: string
  modelID?: string
  contextWindowLimit?: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
}

interface MessageWrapper {
  info: { role: string } & Partial<AssistantMessageInfo>
}

export function createContextWindowMonitorHook(
  ctx: PluginInput,
  modelCacheState?: ModelCacheState,
) {
  const remindedSessions = new Set<string>()

  const toolExecuteAfter = async (
    input: { tool: string; sessionID: string; callID: string },
    output: { title: string; output: string; metadata: unknown }
  ) => {
    const { sessionID } = input

    if (remindedSessions.has(sessionID)) return

    try {
      const response = await ctx.client.session.messages({
        path: { id: sessionID },
      })

      const messages = (response.data ?? response) as MessageWrapper[]

      const assistantMessages = messages
        .filter((m) => m.info.role === "assistant")
        .map((m) => m.info as AssistantMessageInfo)

      if (assistantMessages.length === 0) return

      const lastAssistant = assistantMessages[assistantMessages.length - 1]
      if (!isAnthropicProvider(lastAssistant.providerID)) return

      const lastTokens = lastAssistant.tokens
      const totalInputTokens = (lastTokens?.input ?? 0) + (lastTokens?.cache?.read ?? 0)
      const actualLimit = resolveContextWindowLimit({
        contextWindowLimit: lastAssistant.contextWindowLimit,
        providerID: lastAssistant.providerID,
        modelID: lastAssistant.modelID,
        modelContextLimitsCache: modelCacheState?.modelContextLimitsCache,
      })
      const actualUsagePercentage = totalInputTokens / actualLimit

      if (actualUsagePercentage < CONTEXT_WARNING_THRESHOLD) return

      remindedSessions.add(sessionID)

      const displayUsagePercentage = totalInputTokens / actualLimit
      const usedPct = (displayUsagePercentage * 100).toFixed(1)
      const remainingPct = ((1 - displayUsagePercentage) * 100).toFixed(1)
      const usedTokens = totalInputTokens.toLocaleString()
      const limitTokens = actualLimit.toLocaleString()
      const reminder = `${createSystemDirective(SystemDirectiveTypes.CONTEXT_WINDOW_MONITOR)}

You are using Anthropic Claude with ${formatContextWindowLimitLabel(actualLimit)} context window.
You have plenty of context remaining - do NOT rush or skip tasks.
Complete your work thoroughly and methodically.`

      output.output += `\n\n${reminder}
[Context Status: ${usedPct}% used (${usedTokens}/${limitTokens} tokens), ${remainingPct}% remaining]`
    } catch {
      // Graceful degradation - do not disrupt tool execution
    }
  }

  const eventHandler = async ({ event }: { event: { type: string; properties?: unknown } }) => {
    const props = event.properties as Record<string, unknown> | undefined

    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        remindedSessions.delete(sessionInfo.id)
      }
    }
  }

  return {
    "tool.execute.after": toolExecuteAfter,
    event: eventHandler,
  }
}
