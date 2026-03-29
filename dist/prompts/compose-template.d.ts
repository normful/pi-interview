/**
 * Compose quiz answers into a natural language prompt.
 * Deterministic — no model call needed.
 */
import type { QuizQuestion, QuizAnswer, QuizSubmission } from "../core/types.js";
export declare function composePrompt(questions: QuizQuestion[], answers: QuizAnswer[], maxChars: number): string;
export declare function buildSubmission(questions: QuizQuestion[], answers: QuizAnswer[], maxChars: number, startTime: number, cancelled: boolean): QuizSubmission;
//# sourceMappingURL=compose-template.d.ts.map