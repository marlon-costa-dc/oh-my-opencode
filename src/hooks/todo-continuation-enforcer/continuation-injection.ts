import type { PluginInput } from "@opencode-ai/plugin"

import type { BackgroundManager } from "../../features/background-agent"
import {
  findNearestMessageWithFields,
  type ToolPermission,
} from "../../features/hook-message-injector"
import { log } from "../../shared/logger"

import {
  CONTINUATION_PROMPT,
  DEFAULT_SKIP_AGENTS,
  HOOK_NAME,
} from "./constants"
import { getMessageDir } from "./message-directory"
import { getIncompleteCount } from "./todo"
import type {
  ResolvedMessageInfo,
  Todo,
  TodoContinuationConfig,
} from "./types"
import type { SessionStateStore } from "./session-state"

function hasWritePermission(tools: Record<string, ToolPermission> | undefined): boolean {
  const editPermission = tools?.edit
  const writePermission = tools?.write
  return (
    !tools ||
    (editPermission !== false && editPermission !== "deny" && writePermission !== false && writePermission !== "deny")
  )
}

function getInjectionLimit(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return Number.POSITIVE_INFINITY
  }

  return value
}

async function showStoppedToast(
  ctx: PluginInput,
  reason: string,
): Promise<void> {
  await ctx.client.tui
    .showToast({
      body: {
        title: "Todo Continuation Stopped",
        message: reason,
        variant: "warning",
        duration: 2500,
      },
    })
    .catch(() => {})
}

export async function injectContinuation(args: {
  ctx: PluginInput
  sessionID: string
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  resolvedInfo?: ResolvedMessageInfo
  sessionStateStore: SessionStateStore
  config?: TodoContinuationConfig
}): Promise<void> {
  const {
    ctx,
    sessionID,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    resolvedInfo,
    sessionStateStore,
    config,
  } = args

  const state = sessionStateStore.getState(sessionID)
  if (state.isRecovering) {
    log(`[${HOOK_NAME}] Skipped injection: in recovery`, { sessionID })
    return
  }

  const maxInjections = getInjectionLimit(config?.max_injections)
  const maxStaleInjections = getInjectionLimit(config?.max_stale_injections)

  const currentInjectionCount = state.injectionCount ?? 0
  if (currentInjectionCount >= maxInjections) {
    await showStoppedToast(
      ctx,
      `Maximum continuation injections reached (${currentInjectionCount}).`,
    )
    log(`[${HOOK_NAME}] Skipped injection: max injections reached`, {
      sessionID,
      currentInjectionCount,
      maxInjections,
    })
    return
  }

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false

  if (hasRunningBgTasks) {
    log(`[${HOOK_NAME}] Skipped injection: background tasks running`, { sessionID })
    return
  }

  let todos: Todo[] = []
  try {
    const response = await ctx.client.session.todo({ path: { id: sessionID } })
    todos = (response.data ?? response) as Todo[]
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to fetch todos`, { sessionID, error: String(error) })
    return
  }

  const freshIncompleteCount = getIncompleteCount(todos)
  if (freshIncompleteCount === 0) {
    log(`[${HOOK_NAME}] Skipped injection: no incomplete todos`, { sessionID })
    return
  }

  const lastIncompleteCount = state.lastIncompleteCount
  const staleInjectionCount =
    lastIncompleteCount !== undefined && freshIncompleteCount >= lastIncompleteCount
      ? (state.staleInjectionCount ?? 0) + 1
      : 0

  state.staleInjectionCount = staleInjectionCount
  if (staleInjectionCount >= maxStaleInjections) {
    await showStoppedToast(
      ctx,
      `Stale continuation limit reached (${staleInjectionCount}).`,
    )
    log(`[${HOOK_NAME}] Skipped injection: stale limit reached`, {
      sessionID,
      staleInjectionCount,
      maxStaleInjections,
      freshIncompleteCount,
      lastIncompleteCount,
    })
    return
  }

  let agentName = resolvedInfo?.agent
  let model = resolvedInfo?.model
  let tools = resolvedInfo?.tools

  if (!agentName || !model) {
    const messageDir = getMessageDir(sessionID)
    const previousMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    agentName = agentName ?? previousMessage?.agent
    model =
      model ??
      (previousMessage?.model?.providerID && previousMessage?.model?.modelID
        ? {
            providerID: previousMessage.model.providerID,
            modelID: previousMessage.model.modelID,
            ...(previousMessage.model.variant
              ? { variant: previousMessage.model.variant }
              : {}),
          }
        : undefined)
    tools = tools ?? previousMessage?.tools
  }

  if (agentName && skipAgents.includes(agentName)) {
    log(`[${HOOK_NAME}] Skipped: agent in skipAgents list`, { sessionID, agent: agentName })
    return
  }

  if (!hasWritePermission(tools)) {
    log(`[${HOOK_NAME}] Skipped: agent lacks write permission`, { sessionID, agent: agentName })
    return
  }

  const incompleteTodos = todos.filter((todo) => todo.status !== "completed" && todo.status !== "cancelled")
  const todoList = incompleteTodos.map((todo) => `- [${todo.status}] ${todo.content}`).join("\n")
  const prompt = `${CONTINUATION_PROMPT}

[Status: ${todos.length - freshIncompleteCount}/${todos.length} completed, ${freshIncompleteCount} remaining]

Remaining tasks:
${todoList}`

  try {
    log(`[${HOOK_NAME}] Injecting continuation`, {
      sessionID,
      agent: agentName,
      model,
      incompleteCount: freshIncompleteCount,
    })

    await ctx.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        agent: agentName,
        ...(model !== undefined ? { model } : {}),
        parts: [{ type: "text", text: prompt }],
      },
      query: { directory: ctx.directory },
    })

    state.injectionCount = currentInjectionCount + 1
    state.lastIncompleteCount = freshIncompleteCount

    log(`[${HOOK_NAME}] Injection successful`, { sessionID })
  } catch (error) {
    log(`[${HOOK_NAME}] Injection failed`, { sessionID, error: String(error) })
  }
}
