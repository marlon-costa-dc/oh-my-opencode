import type { HookName, OhMyOpenCodeConfig } from "../../config"
import type { PluginContext } from "../types"

import { createSessionHooks } from "./create-session-hooks"
import { createToolGuardHooks } from "./create-tool-guard-hooks"
import { createTransformHooks } from "./create-transform-hooks"

import type { ModelCacheState } from "../../plugin-state"

export function createCoreHooks(args: {
  ctx: PluginContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
  modelCacheState: ModelCacheState
}) {
  const { ctx, pluginConfig, isHookEnabled, safeHookEnabled, modelCacheState } = args

  const session = createSessionHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    safeHookEnabled,
    modelCacheState,
  })

  const tool = createToolGuardHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    safeHookEnabled,
    modelCacheState,
  })

  const transform = createTransformHooks({
    ctx,
    pluginConfig,
    isHookEnabled: (name) => isHookEnabled(name as HookName),
    safeHookEnabled,
  })

  return {
    ...session,
    ...tool,
    ...transform,
  }
}
