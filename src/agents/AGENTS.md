# AGENTS KNOWLEDGE BASE

## OVERVIEW

32 files containing AI agents and utilities for multi-model orchestration. Each agent has factory function + metadata + fallback chains.

**Primary Agents** (respect UI model selection):
- Sisyphus, Atlas, Prometheus

**Subagents** (use own fallback chains):
- Hephaestus, Oracle, Librarian, Explore, Multimodal-Looker, Metis, Momus, Sisyphus-Junior, Devils-Advocate

## STRUCTURE
```
agents/
├── sisyphus.ts                 # Main orchestrator (530 lines)
├── hephaestus.ts               # Autonomous deep worker (624 lines)
├── oracle.ts                   # Strategic advisor (170 lines)
├── librarian.ts                # Multi-repo research (328 lines)
├── explore.ts                  # Fast codebase grep (124 lines)
├── multimodal-looker.ts        # Media analyzer (58 lines)
├── metis.ts                    # Pre-planning analysis (347 lines)
├── momus.ts                    # Plan validator (244 lines)
├── atlas/                      # Master orchestrator
│   ├── agent.ts                # Atlas factory
│   ├── default.ts              # Claude-optimized prompt
│   ├── gpt.ts                  # GPT-optimized prompt
│   └── utils.ts
├── prometheus/                 # Planning agent
│   ├── index.ts
│   ├── system-prompt.ts        # 6-section prompt assembly
│   ├── plan-template.ts        # Work plan structure (423 lines)
│   ├── interview-mode.ts       # Interview flow (335 lines)
│   ├── plan-generation.ts
│   ├── high-accuracy-mode.ts
│   ├── identity-constraints.ts # Identity rules (301 lines)
│   └── behavioral-summary.ts
├── sisyphus-junior/            # Delegated task executor (category-spawned)
│   ├── index.ts
│   ├── default.ts
│   └── gpt.ts
├── sisyphus.ts                 # Main orchestrator (530 lines)
├── hephaestus.ts               # Autonomous deep worker (618 lines)
├── oracle.ts                   # Strategic advisor (170 lines)
├── librarian.ts                # Multi-repo research (328 lines)
├── explore.ts                  # Fast codebase grep (124 lines)
├── multimodal-looker.ts        # Media analyzer (58 lines)
├── devils-advocate.ts          # Adversarial validation
├── metis.ts                    # Pre-planning analysis (346 lines)
├── momus.ts                    # Plan validator (243 lines)
├── dynamic-agent-prompt-builder.ts  # Dynamic prompt generation (431 lines)
├── builtin-agents/             # Agent registry (8 files)
├── utils.ts                    # Agent creation, model fallback resolution (571 lines)
├── types.ts                    # AgentModelConfig, AgentPromptMetadata
└── index.ts                    # Exports
```

## AGENT MODELS
| Agent | Model | Temp | Purpose |
|-------|-------|------|---------|
| Sisyphus | anthropic/claude-opus-4-6 | 0.1 | Primary orchestrator (fallback: kimi-k2.5 → glm-4.7 → gpt-5.3-codex → gemini-3-pro) |
| Hephaestus | openai/gpt-5.3-codex | 0.1 | Autonomous deep worker, "The Legitimate Craftsman" (requires gpt-5.3-codex, no fallback) |
| Atlas | anthropic/claude-sonnet-4-5 | 0.1 | Master orchestrator (fallback: kimi-k2.5 → gpt-5.2) |
| oracle | openai/gpt-5.2 | 0.1 | Consultation, debugging |
| librarian | zai-coding-plan/glm-4.7 | 0.1 | Docs, GitHub search (fallback: glm-4.7-free) |
| explore | xai/grok-code-fast-1 | 0.1 | Fast contextual grep (fallback: claude-haiku-4-5 → gpt-5-mini → gpt-5-nano) |
| multimodal-looker | google/gemini-3-flash | 0.1 | PDF/image analysis |
| devils-advocate | google/gemini-3-pro-preview | 0.1 | Adversarial validation |
| Prometheus | anthropic/claude-opus-4-6 | 0.1 | Strategic planning (fallback: kimi-k2.5 → gpt-5.2) |
| Metis | anthropic/claude-opus-4-6 | 0.3 | Pre-planning analysis (fallback: kimi-k2.5 → gpt-5.2) |
| Momus | openai/gpt-5.2 | 0.1 | Plan validation (fallback: claude-opus-4-6) |
| Sisyphus-Junior | anthropic/claude-sonnet-4-5 | 0.1 | Category-spawned executor |

## MODEL NOTES

### xAI Grok Model Landscape (Feb 2026)

The Grok model family has evolved significantly. If you have `xai/grok-2-1212` in your configuration, **update immediately** to a newer model.

| Model | Status | Recommended For |
|-------|--------|-----------------|
| `xai/grok-2-1212` | **DEPRECATED** | Nothing — replace immediately |
| `xai/grok-3` | Stable | General reasoning (131K context) |
| `xai/grok-3-mini` | Stable | Lightweight tasks |
| `xai/grok-4` | Latest flagship | Advanced reasoning (256K context) |
| `xai/grok-4-fast` | Latest fast | Reasoning + speed (2M context) |
| `xai/grok-4-1-fast` | **Newest** | Agentic tool calling (2M context) |
| `xai/grok-code-fast-1` | Current | Coding-specific (256K context) |

**Migration Guide**: If your config uses `xai/grok-2-1212`, replace it with:
- `xai/grok-code-fast-1` for coding tasks (recommended for `explore` agent)
- `xai/grok-4-1-fast` for general reasoning and tool calling
- `xai/grok-3` for lightweight tasks with lower latency


## HOW TO ADD
1. Create `src/agents/my-agent.ts` exporting factory + metadata.
2. Add to `agentSources` in `src/agents/builtin-agents.ts`.
3. Update `AgentNameSchema` in `src/config/schema.ts`.
4. Register in `src/index.ts` initialization.

## TOOL RESTRICTIONS

| Agent | Denied | Allowed |
|-------|--------|---------|
| oracle | write, edit, task, call_omo_agent | Read-only consultation |
| librarian | write, edit, task, call_omo_agent | Research tools only |
| explore | write, edit, task, call_omo_agent | Search tools only |
| multimodal-looker | ALL except `read` | Vision-only |
| Sisyphus-Junior | task | No delegation |
| Atlas | task, call_omo_agent | Orchestration only |

## THINKING / REASONING

| Agent | Claude | GPT |
|-------|--------|-----|
| Sisyphus | 32k budget tokens | reasoningEffort: "medium" |
| Hephaestus | — | reasoningEffort: "medium" |
| Oracle | 32k budget tokens | reasoningEffort: "medium" |
| Metis | 32k budget tokens | — |
| Momus | 32k budget tokens | reasoningEffort: "medium" |
| Sisyphus-Junior | 32k budget tokens | reasoningEffort: "medium" |

## HOW TO ADD

1. Create `src/agents/my-agent.ts` exporting factory + metadata
2. Add to `agentSources` in `src/agents/builtin-agents/`
3. Update `AgentNameSchema` in `src/config/schema/agent-names.ts`
4. Register in `src/plugin-handlers/agent-config-handler.ts`

## KEY PATTERNS

- **Factory**: `createXXXAgent(model): AgentConfig`
- **Metadata**: `XXX_PROMPT_METADATA` with category, cost, triggers
- **Model-specific prompts**: Atlas, Sisyphus-Junior have GPT vs Claude variants
- **Dynamic prompts**: Sisyphus, Hephaestus use `dynamic-agent-prompt-builder.ts` to inject available tools/skills/categories

## ANTI-PATTERNS

- **Trust agent self-reports**: NEVER — always verify outputs
- **High temperature**: Don't use >0.3 for code agents
- **Sequential calls**: Use `task` with `run_in_background` for exploration
- **Prometheus writing code**: Planner only — never implements
