/**
 * Model client for pi-quiz.
 * Uses getApiKeyAndHeaders (correct pi API).
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { completeSimple } from "@mariozechner/pi-ai";
import type { QuizResult, QuizConfig } from "../core/types.js";
import type { QuizPromptContext } from "../prompts/interview-template.js";
type CompleteSimpleFn = typeof completeSimple;
interface RuntimeProvider {
    getContext(): ExtensionContext | undefined;
}
export declare class QuizModelClient {
    private runtime;
    private completeFn;
    constructor(runtime: RuntimeProvider, completeFn: CompleteSimpleFn);
    generateQuiz(promptContext: QuizPromptContext, config: QuizConfig): Promise<QuizResult>;
}
export {};
//# sourceMappingURL=model-client.d.ts.map