/**
 * Compose quiz answers into a natural language prompt.
 * Deterministic — no model call needed.
 */
export function composePrompt(questions, answers, maxChars) {
    const parts = [];
    for (const answer of answers) {
        if (answer.skipped)
            continue;
        if (answer.selectedOptions && answer.selectedOptions.length > 0) {
            if (answer.selectedOptions.length === 1) {
                parts.push(answer.selectedOptions[0]);
            }
            else {
                parts.push(answer.selectedOptions.join(", then "));
            }
        }
        if (answer.text && answer.text.trim()) {
            parts.push(answer.text.trim());
        }
    }
    if (parts.length === 0)
        return "";
    let composed = parts.length === 1
        ? parts[0]
        : parts.join(". ");
    if (composed.length > maxChars) {
        composed = composed.slice(0, maxChars - 1) + "…";
    }
    return composed;
}
export function buildSubmission(questions, answers, maxChars, startTime, cancelled) {
    return {
        answers,
        composedPrompt: cancelled ? "" : composePrompt(questions, answers, maxChars),
        cancelled,
        durationMs: Date.now() - startTime,
    };
}
//# sourceMappingURL=compose-template.js.map