/**
 * Quiz prompt template.
 *
 * Every question MUST be multiple choice.
 * No "text" type questions — the UI handles freeform via "Type something else..." option.
 */
import type { TurnContext, QuizConfig } from "../core/types.js";
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
export declare function buildQuizPromptContext(turn: TurnContext, config: QuizConfig): QuizPromptContext;
export declare function renderQuizPrompt(ctx: QuizPromptContext): string;
//# sourceMappingURL=interview-template.d.ts.map