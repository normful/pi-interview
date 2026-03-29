/**
 * Compose quiz answers into a natural language prompt.
 * Deterministic — no model call needed.
 */

import type { QuizQuestion, QuizAnswer, QuizSubmission } from "../core/types.js";

export function composePrompt(
  questions: QuizQuestion[],
  answers: QuizAnswer[],
  maxChars: number
): string {
  const parts: string[] = [];

  for (const answer of answers) {
    if (answer.skipped) continue;

    if (answer.selectedOptions && answer.selectedOptions.length > 0) {
      if (answer.selectedOptions.length === 1) {
        parts.push(answer.selectedOptions[0]);
      } else {
        parts.push(answer.selectedOptions.join(", then "));
      }
    }

    if (answer.text && answer.text.trim()) {
      parts.push(answer.text.trim());
    }
  }

  if (parts.length === 0) return "";

  let composed = parts.length === 1
    ? parts[0]
    : parts.join(". ");

  if (composed.length > maxChars) {
    composed = composed.slice(0, maxChars - 1) + "…";
  }

  return composed;
}

export function buildSubmission(
  questions: QuizQuestion[],
  answers: QuizAnswer[],
  maxChars: number,
  startTime: number,
  cancelled: boolean
): QuizSubmission {
  return {
    answers,
    composedPrompt: cancelled ? "" : composePrompt(questions, answers, maxChars),
    cancelled,
    durationMs: Date.now() - startTime,
  };
}
