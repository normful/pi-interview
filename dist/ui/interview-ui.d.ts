/**
 * Quiz UI — always multiple choice.
 *
 * Every question shows numbered options + "Type something else..." at the bottom.
 * Single question → selecting auto-submits. Multiple → Tab between, Enter to confirm.
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { QuizQuestion, QuizSubmission, QuizConfig } from "../core/types.js";
export declare function showQuizUI(ctx: ExtensionContext, questions: QuizQuestion[], config: QuizConfig): Promise<QuizSubmission>;
//# sourceMappingURL=interview-ui.d.ts.map