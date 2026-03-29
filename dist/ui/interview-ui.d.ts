/**
 * Interview UI component for pi TUI.
 *
 * Renders as a widget below the editor (not a modal) showing:
 * - Multiple choice questions with ↑↓ navigation
 * - Optional text input for notes
 * - Tab to navigate between questions
 * - Enter to accept, Esc to dismiss
 *
 * Inspired by pi's questionnaire.ts example but adapted for the
 * non-blocking widget-below-editor pattern.
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { InterviewQuestion, InterviewSubmission, InterviewConfig } from "../core/types.js";
/**
 * Show interview questions via ctx.ui.custom().
 * Returns the submission result.
 */
export declare function showInterviewUI(ctx: ExtensionContext, questions: InterviewQuestion[], config: InterviewConfig): Promise<InterviewSubmission>;
//# sourceMappingURL=interview-ui.d.ts.map