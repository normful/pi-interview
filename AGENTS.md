# pi-quiz

Multiple-choice next-prompt quiz for [pi](https://github.com/badlogic/pi-mono). Every question has options. Haiku by default.

## Architecture

```
agent_end → TurnContext → project snapshot → haiku → QuizQuestion[] → TUI → composed prompt → editor
                                                                         ↕
                                                              state persistence (appendEntry)
```

## Files (1520 lines)

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point — events, /quiz command, Ctrl+Q, state wiring |
| `src/core/types.ts` | QuizQuestion, QuizAnswer, QuizConfig (no text-only type) |
| `src/core/signals.ts` | TurnContext from pi session branch + agent messages |
| `src/core/state.ts` | Usage tracking, persistence, back-off logic |
| `src/core/project-context.ts` | Fast git+package.json scan (<500ms) |
| `src/prompts/interview-template.ts` | Prompt with grounding rules (must reference files/errors) |
| `src/prompts/compose-template.ts` | Answers → prompt (deterministic, no model) |
| `src/adapters/model-client.ts` | Pi model client (getApiKeyAndHeaders) |
| `src/ui/interview-ui.ts` | TUI: ↑↓ select, # quick-pick, Tab next, Esc dismiss |

## Commands

| Command | Action |
|---------|--------|
| `/quiz` or `/quiz ask` | Trigger manually |
| `/quiz status` | Show config + usage stats |
| `/quiz reset` | Clear state (resets back-off) |
| `/quiz config mode auto\|manual` | Toggle auto/manual |
| `/quiz config model <ref>` | Change model |
| `Ctrl+Q` | Keyboard shortcut |

## Key Decisions

- **All multiple choice** — no text-only questions, "Type something else..." is the escape hatch
- **Haiku** — fast, cheap, and validated to produce grounded options
- **Grounding rules** — options must reference specific files, errors, signals from the turn
- **Back-off** — after 3+ consecutive skips/cancels, pauses auto mode
- **State persistence** — via pi.appendEntry(), survives session restores
- **Project context** — lightweight git+package.json scan, not heavy agentic seeding
- **getApiKeyAndHeaders** — the correct pi API (not the removed getApiKey)
