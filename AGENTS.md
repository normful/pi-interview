# @lnittman/pi-interview

Multiple-choice + notes interview for [pi](https://github.com/badlogic/pi-mono). Based on the proven ask-user extension UX patterns.

## UX

```
┌──────────────────────────────────────────┐
│ ✦ ● ○                                   │
│ What should we focus on next?            │
│                                          │
│  ❯ ☑ 1 Fix the 3 failing tests          │
│    ☐ 2 Clean up unused imports           │
│    ☑ 3 Add error handling to parser      │
│    ☐ 4 Deploy to staging                 │
│                                          │
│  2 selected: Fix the 3 failing tests...  │
│                                          │
│  📝 also check the CI pipeline           │
│                                          │
│  ↑↓ navigate · Space toggle · Enter      │
│  confirm · n note · Tab next · Esc       │
└──────────────────────────────────────────┘
```

- ALL questions are multi-select (☑/☐ checkboxes)
- Space toggles, Enter confirms, 'n' adds notes
- Number keys for quick-toggle
- Selections shown below with count + labels
- sendUserMessage() on confirm — nothing in the editor

## Commands

| Command | Action |
|---------|--------|
| `/interview` or `/interview ask` | Trigger manually |
| `/interview demo [build\|error\|aborted\|questions]` | Test with canned scenarios |
| `/interview status` | Config + usage stats |
| `/interview reset` | Clear state |
| `/interview config mode auto\|manual` | Toggle |
| `Ctrl+I` | Shortcut |

## Architecture

```
agent_end → TurnContext → project snapshot → haiku → questions → multi-select UI → sendUserMessage
                                                                        ↕
                                                             state persistence (appendEntry)
```
