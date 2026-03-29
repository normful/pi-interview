/**
 * Quiz prompt template.
 *
 * Every question MUST be multiple choice.
 * No "text" type questions — the UI handles freeform via "Type something else..." option.
 */

import type { TurnContext, QuizConfig } from "../core/types.js";

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars) + "…";
}

export interface QuizPromptContext {
  assistantText: string;
  turnStatus: TurnContext["status"];
  recentUserPrompts: string[];
  toolSignals: string[];
  touchedFiles: string[];
  unresolvedQuestions: string[];
  abortContextNote?: string;
  maxQuestions: number;
  maxOptions: number;
  customInstruction: string;
}

export function buildQuizPromptContext(
  turn: TurnContext,
  config: QuizConfig
): QuizPromptContext {
  return {
    assistantText: truncate(turn.assistantText, 50_000),
    turnStatus: turn.status,
    recentUserPrompts: turn.recentUserPrompts
      .slice(0, 10)
      .map((p) => truncate(p, 500)),
    toolSignals: turn.toolSignals.slice(0, 12),
    touchedFiles: turn.touchedFiles.slice(0, 10),
    unresolvedQuestions: turn.unresolvedQuestions.slice(0, 8),
    abortContextNote: turn.abortContextNote
      ? truncate(turn.abortContextNote, 300)
      : undefined,
    maxQuestions: config.maxQuestions,
    maxOptions: config.maxOptions,
    customInstruction: config.customInstruction,
  };
}

export function renderQuizPrompt(ctx: QuizPromptContext): string {
  return `You generate multiple-choice questions to help a developer decide what to instruct their coding agent next.

EVERY question MUST have concrete options. No free-text questions.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "string",
      "text": "Short question (under 80 chars)",
      "type": "single",
      "options": [
        { "label": "Concrete action (under 60 chars)", "description": "optional context" }
      ]
    }
  ],
  "skipped": false
}

If the next step is obvious (e.g. agent proposed something clear), return:
{ "questions": [], "skipped": true, "skipReason": "brief reason" }

── Context ──

TurnStatus: ${ctx.turnStatus}
${ctx.abortContextNote ? `\nAbortContext:\n${ctx.abortContextNote}` : ""}

RecentUserMessages:
${ctx.recentUserPrompts.length > 0 ? ctx.recentUserPrompts.map((p) => `- ${p}`).join("\n") : "(none)"}

ToolSignals:
${ctx.toolSignals.length > 0 ? ctx.toolSignals.map((s) => `- ${s}`).join("\n") : "(none)"}

TouchedFiles:
${ctx.touchedFiles.length > 0 ? ctx.touchedFiles.map((f) => `- ${f}`).join("\n") : "(none)"}

UnresolvedQuestions:
${ctx.unresolvedQuestions.length > 0 ? ctx.unresolvedQuestions.map((q) => `- ${q}`).join("\n") : "(none)"}

LatestAssistantMessage:
\`\`\`
${ctx.assistantText || "(empty)"}
\`\`\`
${ctx.customInstruction.trim() ? `\nPreference:\n${ctx.customInstruction.trim()}` : ""}

── Rules ──

- Generate 1-${ctx.maxQuestions} questions, each with 2-${ctx.maxOptions} options
- type is ALWAYS "single" or "multi" — NEVER "text"
- Options must be specific actions grounded in the conversation, not generic
- If the assistant asked questions, turn them into options
- If errors occurred, offer recovery strategies as options
- If a task completed, offer concrete next steps as options
- First option should be the most likely/natural choice
- Use "multi" only when combining actions makes sense
- Labels: concrete verbs ("Run the tests", "Fix the linting errors", "Add error handling to the parser")
- Skip when: agent proposed a clear step and user just needs to affirm, or conversation is wrapping up`;
}
