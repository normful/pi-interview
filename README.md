# pi-interview

> Interactive next-prompt interview extension for [pi](https://github.com/badlogic/pi-mono)

After each agent turn, pi-interview generates structured multiple-choice questions to help you decide what to do next — instead of passive ghost text that guesses what you'll type.

## Install

Add to `~/.pi/agent/settings.json`:

```json
{
  "extensions": [
    "/path/to/pi-interview/dist/index.js"
  ]
}
```

Or once published:

```json
{
  "packages": ["npm:pi-interview"]
}
```

## How it works

1. Agent finishes responding → pi-interview analyzes the conversation
2. Calls a fast model (haiku) to generate 1-3 structured questions
3. Shows an interactive questionnaire in the TUI
4. You select options + optionally add notes
5. Answers are composed into a prompt and placed in your editor

## Usage

**Auto mode** (default): Interview appears after each agent turn (skipped for simple responses).

**Manual mode**: Set with `/interview config mode manual`, then trigger with:
- `Ctrl+I` keyboard shortcut
- `/interview ask` command

## Configuration

```
/interview config mode auto|manual
/interview config model anthropic/claude-haiku-4-5-20251001
/interview config maxQuestions 3
/interview config maxOptions 5
/interview config skip true|false
/interview config thinking off|minimal|low
/interview config instruction "prefer technical questions"
```

## Context Signals

The interview generator receives rich signals from the conversation:

| Signal | Description |
|--------|-------------|
| `assistantText` | What the agent just said |
| `turnStatus` | success / error / aborted |
| `recentUserPrompts` | Your recent messages |
| `toolSignals` | Tools called: `read(file)`, `bash(cmd)` |
| `touchedFiles` | Files modified this turn |
| `unresolvedQuestions` | Questions the agent asked |
| `abortContextNote` | If you interrupted the agent |

## Why not pi-prompt-suggester?

| | prompt-suggester | pi-interview |
|---|---|---|
| **Approach** | Passive ghost text | Active structured questions |
| **Model** | Uses session model (wasteful) | Haiku by default (cheap, fast) |
| **Interaction** | Space to accept | Navigate, select, add notes |
| **Value** | "Here's what you'll probably say" | "Here's what you should think about" |

## License

MIT
