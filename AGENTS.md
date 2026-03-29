# pi-quiz

Multiple-choice next-prompt quiz for [pi](https://github.com/badlogic/pi-mono).

Every question is multiple choice. Always. "Type something else..." is the escape hatch for freeform.

## Flow

```
agent_end → TurnContext → haiku call → QuizQuestion[] → UI → composed prompt → editor
```

## Files

- `src/index.ts` — Entry point, events, /quiz command, Ctrl+Q shortcut
- `src/core/types.ts` — QuizQuestion, QuizAnswer, QuizConfig (no "text" type)
- `src/core/signals.ts` — Turn context from pi session data
- `src/prompts/interview-template.ts` — Prompt that enforces multiple choice
- `src/prompts/compose-template.ts` — Answers → prompt (deterministic, no model)
- `src/adapters/model-client.ts` — Pi model client (getApiKeyAndHeaders)
- `src/ui/interview-ui.ts` — TUI questionnaire (↑↓ select, # quick-pick, Tab next, Esc dismiss)

## Commands

- `/quiz` or `/quiz ask` — trigger manually
- `/quiz status` — show config
- `/quiz config mode auto|manual`
- `/quiz config model anthropic/claude-haiku-4-5-20251001`

## Shortcut

`Ctrl+Q`
