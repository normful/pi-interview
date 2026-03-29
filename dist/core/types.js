/**
 * pi-interview core types
 *
 * Structured question generation instead of passive ghost text.
 * Informed by Saya's context packet layers + Arbor's prompt builder + prompt-suggester's turn signals.
 */
export const DEFAULT_CONFIG = {
    model: "anthropic/claude-haiku-4-5-20251001",
    maxQuestions: 3,
    maxOptions: 5,
    maxPromptChars: 500,
    timeoutMs: 0,
    autoSubmitQuickActions: true,
    mode: "auto",
    skipOnSimpleResponse: true,
    thinkingLevel: "off",
    customInstruction: "",
};
//# sourceMappingURL=types.js.map