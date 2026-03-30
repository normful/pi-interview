/**
 * pi-quiz core types
 *
 * Every question is multiple choice. Always.
 * "Type something else..." is the escape hatch for freeform.
 */
export const DEFAULT_CONFIG = {
    model: "anthropic/claude-sonnet-4-6",
    maxQuestions: 3,
    maxOptions: 5,
    maxPromptChars: 500,
    autoSubmitSingle: true,
    mode: "auto",
    skipOnSimpleResponse: true,
    thinkingLevel: "off",
    customInstruction: "",
};
//# sourceMappingURL=types.js.map