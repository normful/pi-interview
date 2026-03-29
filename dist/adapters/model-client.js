/**
 * Model client for pi-interview.
 *
 * Uses the pi extension context to call a model for question generation.
 * Uses getApiKeyAndHeaders (the CORRECT current pi API, not the removed getApiKey).
 */
import { renderInterviewPrompt } from "../prompts/interview-template.js";
/**
 * Resolve the model to use for question generation.
 * Prefers the configured model, falls back to session default.
 */
function resolveModel(ctx, configuredModelRef) {
    const allModels = ctx.modelRegistry.getAll();
    // Try configured model ref (e.g., "anthropic/claude-haiku-4-5-20251001")
    if (configuredModelRef && configuredModelRef !== "session-default") {
        const [provider, id] = configuredModelRef.split("/");
        const found = allModels.find((m) => m.provider === provider && m.id === id);
        if (found)
            return found;
        // Try by ID alone
        const byId = allModels.find((m) => m.id === configuredModelRef);
        if (byId)
            return byId;
    }
    // Fall back to session's current model
    return ctx.model;
}
/**
 * Parse the model response into structured InterviewResult.
 * Tolerant of markdown fences and minor formatting issues.
 */
function parseInterviewResponse(text, maxQuestions, maxOptions) {
    // Strip markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    // Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return { questions: [], skipped: true, skipReason: "Failed to parse response" };
    }
    try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.skipped === true) {
            return {
                questions: [],
                skipped: true,
                skipReason: parsed.skipReason || "Model chose to skip",
            };
        }
        if (!Array.isArray(parsed.questions)) {
            return { questions: [], skipped: true, skipReason: "No questions array" };
        }
        const questions = parsed.questions
            .slice(0, maxQuestions)
            .map((q, i) => ({
            id: q.id || `q${i + 1}`,
            text: String(q.text || "").slice(0, 120),
            type: ["single", "multi", "text"].includes(q.type) ? q.type : "single",
            options: Array.isArray(q.options)
                ? q.options.slice(0, maxOptions).map((o) => ({
                    label: String(o.label || "").slice(0, 80),
                    description: o.description
                        ? String(o.description).slice(0, 100)
                        : undefined,
                }))
                : undefined,
            optional: q.optional === true,
            placeholder: q.placeholder ? String(q.placeholder).slice(0, 100) : undefined,
        }))
            .filter((q) => q.text.length > 0 &&
            (q.type === "text" || (q.options && q.options.length > 0)));
        return { questions, skipped: questions.length === 0, skipReason: questions.length === 0 ? "No valid questions generated" : undefined };
    }
    catch {
        return { questions: [], skipped: true, skipReason: "JSON parse error" };
    }
}
export class InterviewModelClient {
    runtime;
    completeFn;
    constructor(runtime, completeFn) {
        this.runtime = runtime;
        this.completeFn = completeFn;
    }
    async generateInterview(promptContext, config) {
        const ctx = this.runtime.getContext();
        if (!ctx?.model) {
            return { questions: [], skipped: true, skipReason: "No model available" };
        }
        const model = resolveModel(ctx, config.model);
        if (!model) {
            return { questions: [], skipped: true, skipReason: "Configured model not found" };
        }
        // Use getApiKeyAndHeaders — the CORRECT current pi API
        const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
        if (!auth.ok) {
            return { questions: [], skipped: true, skipReason: `Auth failed: ${auth.error}` };
        }
        const prompt = renderInterviewPrompt(promptContext);
        try {
            const response = await this.completeFn(model, {
                systemPrompt: "You are the question generator for pi-interview. Return ONLY valid JSON matching the requested schema. No commentary, no markdown fences.",
                messages: [
                    {
                        role: "user",
                        content: [{ type: "text", text: prompt }],
                        timestamp: Date.now(),
                    },
                ],
            }, {
                apiKey: auth.apiKey,
                headers: auth.headers,
                reasoning: config.thinkingLevel === "off" ? undefined : config.thinkingLevel,
            });
            // Extract text from AssistantMessage content blocks
            const text = response.content
                .filter((block) => block.type === "text")
                .map((block) => block.text)
                .join("\n");
            const usage = response.usage
                ? {
                    inputTokens: response.usage.input ?? 0,
                    outputTokens: response.usage.output ?? 0,
                    totalTokens: response.usage.totalTokens ?? 0,
                    costTotal: response.usage.cost?.total ?? 0,
                }
                : undefined;
            const result = parseInterviewResponse(text, config.maxQuestions, config.maxOptions);
            result.usage = usage;
            return result;
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return {
                questions: [],
                skipped: true,
                skipReason: `Generation failed: ${msg.slice(0, 100)}`,
            };
        }
    }
}
//# sourceMappingURL=model-client.js.map