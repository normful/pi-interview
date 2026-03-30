/**
 * Interview UI — multi-select + notes, controller + keyboard ergonomic.
 *
 * Key mappings:
 *   j/k or ↑↓ or D-pad     → navigate options
 *   Enter/Space/Cross(×)    → toggle checkbox
 *   Tab/R2                  → confirm & advance
 *   i                       → notes mode (vim insert)
 *   ≤ (Option+, / L1)       → notes mode (DualSense)
 *   ≥ (Option+. / R1)       → toggle checkbox (DualSense)
 *   h/l or ←→               → switch question
 *   Escape/Circle(○)        → dismiss
 *   q                       → dismiss
 *   1-9                     → quick-toggle option
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { QuizQuestion, QuizSubmission, QuizConfig } from "../core/types.js";
export declare function showInterviewUI(ctx: ExtensionContext, questions: QuizQuestion[], config: QuizConfig): Promise<QuizSubmission>;
//# sourceMappingURL=interview-ui.d.ts.map