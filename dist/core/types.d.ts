/**
 * pi-interview core types
 *
 * Structured question generation instead of passive ghost text.
 * Informed by Saya's context packet layers + Arbor's prompt builder + prompt-suggester's turn signals.
 */
export interface TurnContext {
    /** Unique turn identifier */
    turnId: string;
    /** Session leaf ID this turn corresponds to */
    sourceLeafId: string;
    /** Full text of the latest assistant response */
    assistantText: string;
    /** Token usage from the assistant response */
    assistantUsage?: TokenUsage;
    /** How the turn ended */
    status: "success" | "error" | "aborted";
    /** ISO timestamp */
    occurredAt: string;
    /** Recent user prompts (newest first) */
    recentUserPrompts: string[];
    /** Tool calls made: "read(src/index.ts)", "bash(npm test)" */
    toolSignals: string[];
    /** Files touched during this turn */
    touchedFiles: string[];
    /** Questions extracted from assistant text (lines ending with ?) */
    unresolvedQuestions: string[];
    /** Note if user aborted */
    abortContextNote?: string;
}
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costTotal?: number;
}
export type QuestionType = "single" | "multi" | "text";
export interface InterviewOption {
    /** Display label */
    label: string;
    /** Brief description (shown below label) */
    description?: string;
    /** Whether this auto-submits when selected */
    quickAction?: boolean;
}
export interface InterviewQuestion {
    /** Unique question ID */
    id: string;
    /** The question text */
    text: string;
    /** Question type: single-select, multi-select, or freeform text */
    type: QuestionType;
    /** Options for single/multi type */
    options?: InterviewOption[];
    /** Whether this question can be skipped */
    optional?: boolean;
    /** Placeholder for text input */
    placeholder?: string;
}
export interface InterviewResult {
    /** Generated questions */
    questions: InterviewQuestion[];
    /** Model decided no interview needed */
    skipped: boolean;
    /** Why it was skipped */
    skipReason?: string;
    /** Token usage for the generation call */
    usage?: TokenUsage;
}
export interface InterviewAnswer {
    questionId: string;
    /** Selected option labels (for single/multi) */
    selectedOptions?: string[];
    /** Freeform text (for text type or notes) */
    text?: string;
    /** Whether user skipped this question */
    skipped: boolean;
}
export interface InterviewSubmission {
    /** All answers */
    answers: InterviewAnswer[];
    /** Composed natural language prompt from answers */
    composedPrompt: string;
    /** Whether user cancelled the interview entirely */
    cancelled: boolean;
    /** Duration in ms the user spent answering */
    durationMs: number;
}
export interface InterviewConfig {
    /** Model to use for question generation (default: haiku) */
    model: string;
    /** Max questions per interview (default: 3) */
    maxQuestions: number;
    /** Max options per question (default: 5) */
    maxOptions: number;
    /** Max chars for composed prompt (default: 500) */
    maxPromptChars: number;
    /** Auto-dismiss timeout in ms (0 = no timeout, default: 30000) */
    timeoutMs: number;
    /** Auto-submit when single question with quick action selected */
    autoSubmitQuickActions: boolean;
    /** Show interview after every turn or only on explicit trigger */
    mode: "auto" | "manual";
    /** Skip interview when assistant response is simple affirmation */
    skipOnSimpleResponse: boolean;
    /** Thinking level for question generation */
    thinkingLevel: "off" | "minimal" | "low";
    /** Custom instruction appended to interview generation prompt */
    customInstruction: string;
}
export declare const DEFAULT_CONFIG: InterviewConfig;
//# sourceMappingURL=types.d.ts.map