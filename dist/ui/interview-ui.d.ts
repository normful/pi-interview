/**
 * Interview UI — based on the proven ask-user extension patterns.
 *
 * - ALL questions rendered as multi-select (checkboxes, not radio)
 * - Space toggles selection with visual ☑/☐ feedback
 * - Enter confirms and advances
 * - 'n' key opens notes input for any question
 * - Tab navigates between questions
 * - matchesKey/Key for cross-terminal compat
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { QuizQuestion, QuizSubmission, QuizConfig } from "../core/types.js";
export declare function showInterviewUI(ctx: ExtensionContext, questions: QuizQuestion[], config: QuizConfig): Promise<QuizSubmission>;
//# sourceMappingURL=interview-ui.d.ts.map