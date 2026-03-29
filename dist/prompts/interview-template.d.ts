/**
 * Interview prompt template.
 *
 * Instead of "predict the next user message" (prompt-suggester),
 * we ask: "generate structured questions to help the user decide what to do next".
 *
 * Context signals are the same rich turn data (from pi-prompt-suggester's approach),
 * but the output contract is structured JSON questions, not free text.
 */
import type { TurnContext, InterviewConfig } from "../core/types.js";
export interface InterviewPromptContext {
    /** Assistant's last response (truncated) */
    assistantText: string;
    /** How the turn ended */
    turnStatus: TurnContext["status"];
    /** Recent user prompts */
    recentUserPrompts: string[];
    /** Tool calls this turn */
    toolSignals: string[];
    /** Files modified */
    touchedFiles: string[];
    /** Questions the assistant asked */
    unresolvedQuestions: string[];
    /** Abort context if user interrupted */
    abortContextNote?: string;
    /** Max questions to generate */
    maxQuestions: number;
    /** Max options per question */
    maxOptions: number;
    /** Custom instruction from user */
    customInstruction: string;
}
export declare function buildInterviewPromptContext(turn: TurnContext, config: InterviewConfig): InterviewPromptContext;
export declare function renderInterviewPrompt(ctx: InterviewPromptContext): string;
//# sourceMappingURL=interview-template.d.ts.map