/**
 * Compose user answers into a natural language prompt.
 *
 * This runs locally (no model call) — deterministic composition from structured answers.
 */

import type {
  InterviewQuestion,
  InterviewAnswer,
  InterviewSubmission,
} from "../core/types.js";

/**
 * Compose interview answers into a natural-language prompt string.
 * No model call needed — this is deterministic mapping.
 */
export function composePrompt(
  questions: InterviewQuestion[],
  answers: InterviewAnswer[],
  maxChars: number
): string {
  const parts: string[] = [];

  for (const answer of answers) {
    if (answer.skipped) continue;

    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    if (answer.selectedOptions && answer.selectedOptions.length > 0) {
      if (answer.selectedOptions.length === 1) {
        // Single selection — use it directly as the instruction
        parts.push(answer.selectedOptions[0]);
      } else {
        // Multi selection — combine
        parts.push(answer.selectedOptions.join(", then "));
      }
    }

    if (answer.text && answer.text.trim()) {
      parts.push(answer.text.trim());
    }
  }

  if (parts.length === 0) return "";

  // Join parts with natural connectors
  let composed: string;
  if (parts.length === 1) {
    composed = parts[0];
  } else {
    // Combine with periods or semicolons based on content
    composed = parts
      .map((p) => {
        // Ensure each part ends with punctuation or is a short phrase
        const trimmed = p.trim();
        if (
          trimmed.endsWith(".") ||
          trimmed.endsWith("!") ||
          trimmed.endsWith("?")
        ) {
          return trimmed;
        }
        return trimmed;
      })
      .join(". ");
  }

  // Truncate if needed
  if (composed.length > maxChars) {
    composed = composed.slice(0, maxChars - 1) + "…";
  }

  return composed;
}

/**
 * Build a full InterviewSubmission from questions, answers, and timing.
 */
export function buildSubmission(
  questions: InterviewQuestion[],
  answers: InterviewAnswer[],
  maxChars: number,
  startTime: number,
  cancelled: boolean
): InterviewSubmission {
  return {
    answers,
    composedPrompt: cancelled ? "" : composePrompt(questions, answers, maxChars),
    cancelled,
    durationMs: Date.now() - startTime,
  };
}
