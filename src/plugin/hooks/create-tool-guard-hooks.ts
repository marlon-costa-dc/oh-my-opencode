import type { HookName, OhMyOpenCodeConfig } from "../../config"
import type { PluginContext } from "../types"

import {
  createCommentCheckerHooks,
  createToolOutputTruncatorHook,
  createDirectoryAgentsInjectorHook,
  createDirectoryReadmeInjectorHook,
  createEmptyTaskResponseDetectorHook,
  createRulesInjectorHook,
  createTasksTodowriteDisablerHook,
  createWriteExistingFileGuardHook,
  createRuntimeFallbackHook,
  createLoopDetectorHook,
  createDefinitionGatesHook,
} from "../../hooks"
import {
  getOpenCodeVersion,
  isOpenCodeVersionAtLeast,
  log,
  OPENCODE_NATIVE_AGENTS_INJECTION_VERSION,
} from "../../shared"
import { safeCreateHook } from "../../shared/safe-create-hook"

import type { ModelCacheState } from "../../plugin-state"

export type ToolGuardHooks = {
  commentChecker: ReturnType<typeof createCommentCheckerHooks> | null
  toolOutputTruncator: ReturnType<typeof createToolOutputTruncatorHook> | null
  directoryAgentsInjector: ReturnType<typeof createDirectoryAgentsInjectorHook> | null
  directoryReadmeInjector: ReturnType<typeof createDirectoryReadmeInjectorHook> | null
  emptyTaskResponseDetector: ReturnType<typeof createEmptyTaskResponseDetectorHook> | null
  rulesInjector: ReturnType<typeof createRulesInjectorHook> | null
  tasksTodowriteDisabler: ReturnType<typeof createTasksTodowriteDisablerHook> | null
  writeExistingFileGuard: ReturnType<typeof createWriteExistingFileGuardHook> | null
  runtimeFallback: ReturnType<typeof createRuntimeFallbackHook> | null
  loopDetector: ReturnType<typeof createLoopDetectorHook> | null
  definitionGates: ReturnType<typeof createDefinitionGatesHook> | null
}

export function createToolGuardHooks(args: {
  ctx: PluginContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
  modelCacheState: ModelCacheState
}): ToolGuardHooks {
  const { ctx, pluginConfig, isHookEnabled, safeHookEnabled, modelCacheState } = args
  const safeHook = <T>(hookName: HookName, factory: () => T): T | null =>
    safeCreateHook(hookName, factory, { enabled: safeHookEnabled })

  const commentChecker = isHookEnabled("comment-checker")
    ? safeHook("comment-checker", () => createCommentCheckerHooks(pluginConfig.comment_checker))
    : null

  const toolOutputTruncator = isHookEnabled("tool-output-truncator")
    ? safeHook("tool-output-truncator", () =>
        createToolOutputTruncatorHook(ctx, { experimental: pluginConfig.experimental }, modelCacheState))
    : null

  let directoryAgentsInjector: ReturnType<typeof createDirectoryAgentsInjectorHook> | null = null
  if (isHookEnabled("directory-agents-injector")) {
    const currentVersion = getOpenCodeVersion()
    const hasNativeSupport =
      currentVersion !== null && isOpenCodeVersionAtLeast(OPENCODE_NATIVE_AGENTS_INJECTION_VERSION)
    if (hasNativeSupport) {
      log("directory-agents-injector auto-disabled due to native OpenCode support", {
        currentVersion,
        nativeVersion: OPENCODE_NATIVE_AGENTS_INJECTION_VERSION,
      })
    } else {
      directoryAgentsInjector = safeHook("directory-agents-injector", () => createDirectoryAgentsInjectorHook(ctx))
    }
  }

  const directoryReadmeInjector = isHookEnabled("directory-readme-injector")
    ? safeHook("directory-readme-injector", () => createDirectoryReadmeInjectorHook(ctx))
    : null

  const emptyTaskResponseDetector = isHookEnabled("empty-task-response-detector")
    ? safeHook("empty-task-response-detector", () => createEmptyTaskResponseDetectorHook(ctx))
    : null

  const rulesInjector = isHookEnabled("rules-injector")
    ? safeHook("rules-injector", () => createRulesInjectorHook(ctx))
    : null

  const tasksTodowriteDisabler = isHookEnabled("tasks-todowrite-disabler")
    ? safeHook("tasks-todowrite-disabler", () =>
        createTasksTodowriteDisablerHook({ experimental: pluginConfig.experimental }))
    : null

  const writeExistingFileGuard = isHookEnabled("write-existing-file-guard")
    ? safeHook("write-existing-file-guard", () => createWriteExistingFileGuardHook(ctx))
    : null

  const runtimeFallback = isHookEnabled("runtime-fallback")
    ? safeHook("runtime-fallback", () =>
        createRuntimeFallbackHook(ctx, {
          config: pluginConfig.runtime_fallback,
          pluginConfig,
        }))
    : null

  const loopDetector = isHookEnabled("loop-detector")
    ? safeHook("loop-detector", () => createLoopDetectorHook(ctx))
    : null

  const definitionGates = isHookEnabled("definition-gates")
    ? safeHook("definition-gates", () => createDefinitionGatesHook(ctx))
    : null

  return {
    commentChecker,
    toolOutputTruncator,
    directoryAgentsInjector,
    directoryReadmeInjector,
    emptyTaskResponseDetector,
    rulesInjector,
    tasksTodowriteDisabler,
    writeExistingFileGuard,
    runtimeFallback,
    loopDetector,
    definitionGates,
  }
}
