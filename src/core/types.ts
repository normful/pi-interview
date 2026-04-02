/**
 * pi-quiz core types
 *
 * Every question is multiple choice. Always.
 * "Type something else..." is the escape hatch for freeform.
 */

// ─── Turn Context (from conversation signals) ───────────────────────────────

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
  /** All unique files touched across the full session (not just this turn) */
  sessionFiles?: string[];
  /** Condensed session trajectory: what happened in prior turns */
  trajectory?: string[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costTotal?: number;
}

// ─── Quiz Questions (always multiple choice) ────────────────────────────────

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

// ─── User Answers ───────────────────────────────────────────────────────────

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

// ─── Config ─────────────────────────────────────────────────────────────────

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

export const DEFAULT_CONFIG: QuizConfig = {
  model: "aihubmix-am/cc-minimax-m2.7-highspeed",
  maxQuestions: 3,
  maxOptions: 5,
  maxPromptChars: 500,
  autoSubmitSingle: true,
  mode: "auto",
  skipOnSimpleResponse: true,
  thinkingLevel: "off",
  customInstruction: "",
};
