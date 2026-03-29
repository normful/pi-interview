/**
 * Compose user answers into a natural language prompt.
 *
 * This runs locally (no model call) — deterministic composition from structured answers.
 */
import type { InterviewQuestion, InterviewAnswer, InterviewSubmission } from "../core/types.js";
/**
 * Compose interview answers into a natural-language prompt string.
 * No model call needed — this is deterministic mapping.
 */
export declare function composePrompt(questions: InterviewQuestion[], answers: InterviewAnswer[], maxChars: number): string;
/**
 * Build a full InterviewSubmission from questions, answers, and timing.
 */
export declare function buildSubmission(questions: InterviewQuestion[], answers: InterviewAnswer[], maxChars: number, startTime: number, cancelled: boolean): InterviewSubmission;
//# sourceMappingURL=compose-template.d.ts.map