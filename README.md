# pi-quiz

> Multiple-choice next-prompt quiz for [pi](https://github.com/badlogic/pi-mono)

After each agent turn, generates structured multiple-choice questions to help you decide what to do next. Every question has options — no blank text fields.

## Install

```json
{
  "extensions": ["/path/to/pi-quiz/dist/index.js"]
}
```

## How it works

1. Agent finishes → pi-quiz analyzes the conversation
2. Calls haiku to generate 1-3 multiple-choice questions
3. Shows an interactive quiz in the TUI
4. You pick options (or "Type something else...")
5. Composed prompt lands in your editor

## Usage

**Auto mode** (default): Quiz appears after substantial agent turns.

**Manual**: `/quiz config mode manual`, then `Ctrl+Q` or `/quiz ask`.

**Number keys** for instant pick. `Tab` between questions. `Esc` to dismiss.

## License

MIT
