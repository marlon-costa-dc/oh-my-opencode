import type { BuiltinSkill } from "../types"

export const eskilCoreSkill: BuiltinSkill = {
  name: "eskil-core",
  description:
    "Foundational engineering method for architecture decisions, API/format design, and systematic debugging.",
  template: `# Eskil Core

Dependability comes from architecture and debugability, not cleverness.

## Core stance

- Optimize for long-term maintainability over short-term typing speed.
- Prefer designs one engineer can fully own.
- Make failures obvious and local.

## Architecture decisions

| Decision | Prefer | Avoid |
|---|---|---|
| Module boundaries | Split until one person can own a module end-to-end | Cross-cutting modules that require multiple owners |
| Interface design | Blackbox APIs with hidden internals | Exposing internal state/contracts |
| API evolution | Signatures that can absorb future capabilities | "good enough for now" APIs that require churn |
| Dependencies | Wrap external libraries behind local adapters | Direct calls everywhere |
| Data model | One simple primitive that generalizes | Multiple overlapping representations |
| Formats/protocols | Small, explicit formats with constrained options | Optionality explosion |

## Debugging decisions

| Problem type | Action |
|---|---|
| Silent corruption risk | Add assertions and invariant validators near mutation points |
| Hard-to-reproduce bug | Add record/replay hooks around core data flow |
| Unknown fault location | Binary-search execution path: known-good before, known-bad after |
| Late-discovered failures | Move detection earlier (compile/tool/runtime checks) |
| Hidden control flow | Replace magic/implicit behavior with explicit code paths |

## Bug severity ladder

Prefer failures in this order: compile error -> tool error -> runtime crash -> wrong behavior -> silent corruption.

Design choices should push defects upward on this ladder.

## Integration checklist

- APIs are stable, explicit, and future-capable.
- External dependencies are wrapped.
- Core invariants are encoded as executable checks.
- Failure modes are observable in debug paths.
- Logging/recording exists where data correctness matters most.
`,
}
