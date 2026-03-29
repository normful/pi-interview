/**
 * pi-quiz core types
 *
 * Every question is multiple choice. Always.
 * "Type something else..." is the escape hatch for freeform.
 */
export interface TurnContext {
    turnId: string;
    sourceLeafId: string;
    assistantText: string;
    assistantUsage?: TokenUsage;
    status: "success" | "error" | "aborted";
    occurredAt: string;
    recentUserPrompts: string[];
    toolSignals: string[];
    touchedFiles: string[];
    unresolvedQuestions: string[];
    abortContextNote?: string;
}
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costTotal?: number;
}
export type QuestionType = "single" | "multi";
export interface QuizOption {
    label: string;
    description?: string;
}
export interface QuizQuestion {
    id: string;
    text: string;
    /** single = pick one, multi = pick several */
    type: QuestionType;
    /** Always present — every question is multiple choice */
    options: QuizOption[];
}
export interface QuizResult {
    questions: QuizQuestion[];
    skipped: boolean;
    skipReason?: string;
    usage?: TokenUsage;
}
export interface QuizAnswer {
    questionId: string;
    /** Selected option labels */
    selectedOptions?: string[];
    /** Freeform text from "Type something else..." */
    text?: string;
    skipped: boolean;
}
export interface QuizSubmission {
    answers: QuizAnswer[];
    composedPrompt: string;
    cancelled: boolean;
    durationMs: number;
}
export interface QuizConfig {
    model: string;
    maxQuestions: number;
    maxOptions: number;
    maxPromptChars: number;
    autoSubmitSingle: boolean;
    mode: "auto" | "manual";
    skipOnSimpleResponse: boolean;
    thinkingLevel: "off" | "minimal" | "low";
    customInstruction: string;
}
export declare const DEFAULT_CONFIG: QuizConfig;
//# sourceMappingURL=types.d.ts.map