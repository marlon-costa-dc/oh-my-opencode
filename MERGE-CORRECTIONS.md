# Correções para Contribuir aos PRs Originais

Este documento lista todas as correções necessárias para adaptar os PRs originais à arquitetura modular do upstream/dev (commit 0565ce83).

## Arquitetura Modular (Upstream Commit 3d5abb95)

O upstream refatorou o schema monolítico (`src/config/schema.ts`) em 21 arquivos modulares em `src/config/schema/`. Cada feature precisa seguir este padrão.

## Correções por Feature

### 1. **review-loop** (PR original desconhecido)

**Arquivos a criar:**
- `src/config/schema/review-loop.ts`:
  ```typescript
  import { z } from "zod"

  export const ReviewLoopConfigSchema = z.object({
    enabled: z.boolean().default(false),
    default_max_iterations: z.number().min(1).max(100).default(10),
    state_dir: z.string().optional(),
  })

  export type ReviewLoopConfig = z.infer<typeof ReviewLoopConfigSchema>
  ```

**Arquivos a modificar:**
- `src/config/schema.ts`: Adicionar `export * from "./schema/review-loop"`
- `src/config/schema/hooks.ts`: Adicionar `"review-loop"` ao enum `HookNameSchema`
- `src/config/schema/commands.ts`: Adicionar `"review-loop"` ao enum `BuiltinCommandNameSchema`
- `src/config/schema/oh-my-opencode-config.ts`: Adicionar campo `review_loop: ReviewLoopConfigSchema.optional()`
- `src/config/index.ts`: Adicionar exports de `ReviewLoopConfigSchema` e `ReviewLoopConfig`

### 2. **boulder-loop** (origin/feature/boulder-loop)

**Arquivos a criar:**
- `src/config/schema/boulder-loop.ts`:
  ```typescript
  import { z } from "zod"

  export const BoulderLoopConfigSchema = z.object({
    enabled: z.boolean().default(false),
    default_deadline_hours: z.number().min(1).default(24),
    state_dir: z.string().optional(),
  })

  export type BoulderLoopConfig = z.infer<typeof BoulderLoopConfigSchema>
  ```

**Arquivos a modificar:**
- `src/config/schema.ts`: Adicionar `export * from "./schema/boulder-loop"`
- `src/config/schema/hooks.ts`: Adicionar `"boulder-loop"` e `"boulder-question-auto-answer"` ao enum
- `src/config/schema/commands.ts`: Adicionar `"boulder"` e `"cancel-boulder"` ao enum
- `src/config/schema/oh-my-opencode-config.ts`: Adicionar campo `boulder_loop: BoulderLoopConfigSchema.optional()`
- `src/config/index.ts`: Adicionar exports de `BoulderLoopConfigSchema` e `BoulderLoopConfig`

### 3. **runtime-fallback** (origin/feat/runtime-fallback-only)

**Arquivos a criar:**
- `src/config/schema/runtime-fallback.ts`:
  ```typescript
  import { z } from "zod"

  export const FallbackModelsSchema = z.array(z.string())

  export const RuntimeFallbackConfigSchema = z.object({
    enabled: z.boolean().default(true),
    retry_on_errors: z.array(z.number()).default([429, 503, 529]),
    max_fallback_attempts: z.number().min(1).max(10).default(3),
    cooldown_seconds: z.number().min(0).default(60),
    notify_on_fallback: z.boolean().default(true),
  })

  export type FallbackModels = z.infer<typeof FallbackModelsSchema>
  export type RuntimeFallbackConfig = z.infer<typeof RuntimeFallbackConfigSchema>
  ```

**Arquivos a modificar:**
- `src/config/schema.ts`: Adicionar `export * from "./schema/runtime-fallback"`
- `src/config/schema/categories.ts`: Adicionar campo `fallback_models: FallbackModelsSchema.optional()` ao `CategoryConfigSchema`
- `src/config/schema/agent-overrides.ts`: Adicionar campo `fallback_models: FallbackModelsSchema.optional()` ao `AgentOverrideConfigSchema`
- `src/config/schema/oh-my-opencode-config.ts`: Adicionar campo `runtime_fallback: RuntimeFallbackConfigSchema.optional()`
- `src/config/index.ts`: Adicionar exports de `RuntimeFallbackConfigSchema`, `FallbackModelsSchema`, `RuntimeFallbackConfig`
- `src/hooks/index.ts`: Adicionar `export { createRuntimeFallbackHook } from "./runtime-fallback"`

### 4. **mobius-loop-hooks** (origin/feat/mobius-loop-hooks)

**Arquivos a modificar:**
- `src/config/schema/hooks.ts`: Adicionar `"loop-detector"` e `"definition-gates"` ao enum `HookNameSchema`
- `src/hooks/index.ts`: Adicionar:
  ```typescript
  export { createLoopDetectorHook } from "./loop-detector"
  export { createDefinitionGatesHook } from "./definition-gates"
  ```

### 5. **ralph-loop enhancements** (edxeth/dev)

**Arquivos a criar:**
- `src/config/schema/context-strategy.ts`:
  ```typescript
  import { z } from "zod"

  export const ContextStrategySchema = z.enum(["reset", "continue"])

  export type ContextStrategy = z.infer<typeof ContextStrategySchema>
  ```

**Arquivos a modificar:**
- `src/config/schema.ts`: Adicionar `export * from "./schema/context-strategy"`
- `src/config/schema/ralph-loop.ts`: 
  ```typescript
  import { ContextStrategySchema } from "./context-strategy"
  
  export const RalphLoopConfigSchema = z.object({
    enabled: z.boolean().default(false),
    default_max_iterations: z.number().min(1).max(1000).default(100),
    state_dir: z.string().optional(),
    default_strategy: ContextStrategySchema.optional(),
  })
  ```
- `src/config/index.ts`: Adicionar exports de `ContextStrategySchema` e `ContextStrategy`
- `src/hooks/index.ts`: Adicionar `export { createCompactionTodoPreserverHook, type CompactionTodoPreserver } from "./compaction-todo-preserver"`

### 6. **TUI config editor** (origin/feature/tui-config-editor)

Sem correções de schema necessárias - apenas mudanças em `src/cli/`.

## Correções Gerais para TODOS os PRs

### 1. Tool Exports

**Problema**: Upstream espera funções factory `createGlobTools()` e `createGrepTools()`.

**Arquivos a criar:**
- `src/tools/glob/utils.ts`:
  ```typescript
  export { formatGlobResult } from "./result-formatter"
  ```
- `src/tools/grep/utils.ts`:
  ```typescript
  export { formatGrepResult } from "./result-formatter"
  ```

**Arquivos a modificar:**
- `src/tools/glob/tools.ts`: Adicionar no final:
  ```typescript
  export function createGlobTools(_ctx?: unknown) {
    return { glob }
  }
  ```
- `src/tools/grep/tools.ts`: Adicionar no final:
  ```typescript
  export function createGrepTools(_ctx?: unknown) {
    return { grep }
  }
  ```

### 2. Delegate Task Helpers

**Arquivo a criar:**
- `src/tools/delegate-task/helpers.ts`:
  ```typescript
  export { parseModelString } from "./model-string-parser"
  export { formatDuration } from "./time-formatter"
  export { formatDetailedError } from "./error-formatting"
  export { getMessageDir } from "../../features/background-agent/message-storage-locator"
  ```

### 3. Hook Exports

**Arquivo a modificar:**
- `src/hooks/index.ts`: Adicionar exports:
  ```typescript
  export { createWriteExistingFileGuardHook } from "./write-existing-file-guard"
  export { createTaskReminderHook } from "./task-reminder"
  ```
- Remover export incorreto:
  ```typescript
  // REMOVER: export { ..., type SummarizeContext } from "./compaction-context-injector"
  // MANTER: export { createCompactionContextInjector } from "./compaction-context-injector"
  ```

### 4. Model Resolution Pipeline

**Arquivo a modificar:**
- `src/shared/model-resolution-pipeline.ts` (linha 105):
  ```typescript
  // ANTES:
  const connectedProviders = readConnectedProvidersCache()
  
  // DEPOIS:
  const connectedProviders = connectedProvidersCache.readConnectedProvidersCache()
  ```

## Verificação Final

Após aplicar todas as correções, executar:

```bash
bun run typecheck  # Deve retornar 0 erros
bun run build      # Deve compilar sem erros
```

## Resumo Estatístico

- **Total de arquivos modificados**: 70 files
- **Linhas adicionadas**: +9695
- **Linhas removidas**: -389
- **Schemas modulares criados**: 4 (context-strategy, runtime-fallback, boulder-loop, review-loop)
- **Hooks registrados**: 9 novos hooks
- **Comandos adicionados**: 4 (`review-loop`, `boulder`, `cancel-boulder`, alterações em `ralph-loop`)

## Notas de Contribuição

Para contribuir essas correções de volta aos PRs originais:

1. **Criar branches separados** para cada feature no fork do autor
2. **Aplicar apenas as correções específicas** de cada feature
3. **Testar isoladamente** cada feature após as correções
4. **Abrir PRs** nos repositórios dos autores originais com descrição clara das mudanças
5. **Referenciar** o commit upstream `3d5abb95` que introduziu a arquitetura modular

## Comandos Git para Contribuir

```bash
# Para cada PR original:
git remote add author-fork https://github.com/AUTHOR/oh-my-opencode
git fetch author-fork
git checkout -b fix/modular-architecture-FEATURE author-fork/BRANCH
# Aplicar correções específicas da feature
git add -A
git commit -m "fix: adapt FEATURE to upstream modular schema architecture

Upstream commit 3d5abb95 refactored monolithic schema.ts into 21 modular files.
This commit adapts FEATURE to follow the new structure:
- Create src/config/schema/FEATURE.ts
- Add barrel exports to schema.ts
- Update hook/command registrations
- Fix TypeScript compilation errors

Related: upstream/dev@3d5abb95"
git push author-fork fix/modular-architecture-FEATURE
# Abrir PR no GitHub do autor
```
