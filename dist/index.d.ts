/**
 * pi-interview — Interactive next-prompt interview extension for pi.
 *
 * Instead of passive ghost text suggestions (pi-prompt-suggester),
 * this extension generates structured multiple-choice questions
 * after each agent turn to help the user articulate their next instruction.
 *
 * Architecture:
 * 1. Hooks into agent_end → builds TurnContext from conversation signals
 * 2. Calls a lightweight model (haiku) with interview prompt
 * 3. Shows interactive questionnaire via ctx.ui.custom()
 * 4. Composes answers into natural language → injects into editor
 *
 * Context signals (same rich data as prompt-suggester):
 * - assistantText, turnStatus, recentUserPrompts
 * - toolSignals, touchedFiles, unresolvedQuestions
 * - abortContextNote
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
export default function interview(pi: ExtensionAPI): void;
//# sourceMappingURL=index.d.ts.map