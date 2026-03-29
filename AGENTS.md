# pi-interview

Interactive next-prompt interview extension for [pi](https://github.com/badlogic/pi-mono).

Instead of passive ghost text suggestions (pi-prompt-suggester), this generates **structured multiple-choice questions** after each agent turn to help the user articulate their next instruction.

## Architecture

```
agent_end event
    │
    ▼
Build TurnContext (conversation signals)
    │ assistantText, status, toolSignals,
    │ touchedFiles, unresolvedQuestions,
    │ recentUserPrompts, abortContextNote
    ▼
Call model (haiku by default) with interview prompt
    │
    ▼
Parse structured JSON response → InterviewQuestion[]
    │
    ▼
Show interactive questionnaire (ctx.ui.custom)
    │ ↑↓ navigate, Enter select, Tab between questions
    │ Number keys for quick-select, Esc dismiss
    ▼
Compose answers → natural language prompt
    │
    ▼
Inject into editor (setEditorText)
```

## Files

- `src/index.ts` — Extension entry point, event hooks, commands
- `src/core/types.ts` — Domain types (TurnContext, InterviewQuestion, InterviewConfig)
- `src/core/signals.ts` — Conversation signal extraction from pi session data
- `src/prompts/interview-template.ts` — Prompt template for question generation
- `src/prompts/compose-template.ts` — Deterministic answer → prompt composition
- `src/adapters/model-client.ts` — Pi model client (uses correct getApiKeyAndHeaders API)
- `src/ui/interview-ui.ts` — TUI questionnaire component

## Commands

- `/interview` or `/interview ask` — manually trigger interview
- `/interview status` — show current config
- `/interview config <key> <value>` — change settings

Config keys: `mode`, `model`, `maxQuestions`, `maxOptions`, `skip`, `thinking`, `instruction`

## Keyboard Shortcut

`Ctrl+I` — trigger interview manually (works in both auto and manual mode)

## Key Decisions

- **haiku by default** — prompt suggestions don't need frontier models
- **No seeding** — simpler than prompt-suggester; turn context is sufficient
- **No steering loop** — may add later if we track answer patterns
- **ctx.ui.custom() not ghost editor** — active questionnaire, not passive ghost text
- **Uses getApiKeyAndHeaders** — the correct current pi API (not the removed getApiKey)
