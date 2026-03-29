/**
 * Model client for pi-interview.
 *
 * Uses the pi extension context to call a model for question generation.
 * Uses getApiKeyAndHeaders (the CORRECT current pi API, not the removed getApiKey).
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { completeSimple } from "@mariozechner/pi-ai";
import type { InterviewResult, InterviewConfig } from "../core/types.js";
import type { InterviewPromptContext } from "../prompts/interview-template.js";
type CompleteSimpleFn = typeof completeSimple;
interface RuntimeProvider {
    getContext(): ExtensionContext | undefined;
}
export declare class InterviewModelClient {
    private runtime;
    private completeFn;
    constructor(runtime: RuntimeProvider, completeFn: CompleteSimpleFn);
    generateInterview(promptContext: InterviewPromptContext, config: InterviewConfig): Promise<InterviewResult>;
}
export {};
//# sourceMappingURL=model-client.d.ts.map