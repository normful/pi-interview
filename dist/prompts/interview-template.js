/**
 * Interview prompt template.
 *
 * Instead of "predict the next user message" (prompt-suggester),
 * we ask: "generate structured questions to help the user decide what to do next".
 *
 * Context signals are the same rich turn data (from pi-prompt-suggester's approach),
 * but the output contract is structured JSON questions, not free text.
 */
function truncate(value, maxChars) {
    if (value.length <= maxChars)
        return value;
    return value.slice(0, maxChars) + "…";
}
export function buildInterviewPromptContext(turn, config) {
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
export function renderInterviewPrompt(ctx) {
    return `You are generating structured interview questions to help a developer decide what to instruct their coding agent to do next.

Analyze the conversation context and generate 1-${ctx.maxQuestions} focused questions that:
- Help the user articulate their next instruction clearly
- Surface relevant options they might not have considered
- Reduce cognitive load through concrete, actionable choices

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "id": "string",
      "text": "The question to ask",
      "type": "single" | "multi" | "text",
      "options": [
        { "label": "Option text", "description": "Brief context (optional)" }
      ],
      "optional": boolean
    }
  ],
  "skipped": false
}

If no meaningful questions can be generated (e.g., the conversation is clearly done or the next step is obvious), return:
{ "questions": [], "skipped": true, "skipReason": "brief reason" }

─── Context ───

TurnStatus: ${ctx.turnStatus}
${ctx.abortContextNote ? `\nAbortContext:\n${ctx.abortContextNote}` : ""}

RecentUserMessages:
${ctx.recentUserPrompts.length > 0 ? ctx.recentUserPrompts.map((p) => `- ${p}`).join("\n") : "(none)"}

ToolSignals:
${ctx.toolSignals.length > 0 ? ctx.toolSignals.map((s) => `- ${s}`).join("\n") : "(none)"}

TouchedFiles:
${ctx.touchedFiles.length > 0 ? ctx.touchedFiles.map((f) => `- ${f}`).join("\n") : "(none)"}

UnresolvedQuestions (from assistant):
${ctx.unresolvedQuestions.length > 0 ? ctx.unresolvedQuestions.map((q) => `- ${q}`).join("\n") : "(none)"}

LatestAssistantMessage:
\`\`\`
${ctx.assistantText || "(empty)"}
\`\`\`
${ctx.customInstruction.trim() ? `\nAdditional preference:\n${ctx.customInstruction.trim()}` : ""}

─── Rules ───

Question design:
- Each question must have a clear, concise "text" (under 80 chars)
- Options should be specific and actionable, not generic ("Continue" is too vague)
- Use "single" type for direction decisions (pick one path)
- Use "multi" type when user might want to combine actions
- Use "text" type for freeform input (constraints, notes, specific instructions)
- Max ${ctx.maxOptions} options per question
- If the assistant asked questions, transform them into structured options
- Always include one question that allows the user to specify something custom

Option design:
- Labels under 60 chars, concrete and action-oriented
- Include brief "description" when the option needs context (under 80 chars)
- Options should reflect the ACTUAL state of the conversation, not generic templates
- Order options by likely relevance (most probable first)

When to skip:
- The assistant proposed a clear next step and the user likely just needs to approve
- The conversation is wrapping up naturally
- The last user message was a simple directive that was completed

When to generate:
- The assistant finished a task and multiple follow-ups are possible
- Errors occurred and recovery strategies vary
- The user aborted and might want to redirect
- The assistant asked questions that benefit from structured options
- A complex task completed and scope/direction decisions are needed`;
}
//# sourceMappingURL=interview-template.js.map