/**
 * pi-interview — Interactive next-prompt interview extension for pi.
 *
 * Instead of passive ghost text suggestions (pi-prompt-suggester),
 * this extension generates structured multiple-choice questions
 * after each agent turn to help the user articulate their next instruction.
 *
 * Architecture:
 * 1. Hooks into agent_end → builds TurnContext from conversation signals
 * 2. Calls a lightweight model (haiku) with interview prompt
 * 3. Shows interactive questionnaire via ctx.ui.custom()
 * 4. Composes answers into natural language → injects into editor
 *
 * Context signals (same rich data as prompt-suggester):
 * - assistantText, turnStatus, recentUserPrompts
 * - toolSignals, touchedFiles, unresolvedQuestions
 * - abortContextNote
 */
import { completeSimple } from "@mariozechner/pi-ai";
import { buildTurnContext, buildTurnContextFromBranch } from "./core/signals.js";
import { buildInterviewPromptContext } from "./prompts/interview-template.js";
import { InterviewModelClient } from "./adapters/model-client.js";
import { showInterviewUI } from "./ui/interview-ui.js";
import { DEFAULT_CONFIG } from "./core/types.js";
export default function interview(pi) {
    // ─── State ──────────────────────────────────────────────────────────────
    let config = { ...DEFAULT_CONFIG };
    let currentContext;
    let lastTurnContext;
    let interviewActive = false;
    let generationEpoch = 0;
    // ─── Model Client ─────────────────────────────────────────────────────
    const modelClient = new InterviewModelClient({ getContext: () => currentContext }, completeSimple);
    // ─── Core Flow ────────────────────────────────────────────────────────
    async function runInterview(turn, ctx, epoch) {
        if (!ctx.hasUI)
            return;
        if (interviewActive)
            return;
        if (epoch !== generationEpoch)
            return;
        // Skip if the response was trivially short (likely just an ack)
        if (config.skipOnSimpleResponse &&
            turn.assistantText.length < 100 &&
            turn.unresolvedQuestions.length === 0 &&
            turn.status === "success") {
            return;
        }
        interviewActive = true;
        try {
            // Build prompt context
            const promptContext = buildInterviewPromptContext(turn, config);
            // Show loading indicator
            ctx.ui.setWidget("interview-status", [
                `  ${ctx.ui.theme.fg("dim", "✦ generating interview questions...")}`,
            ], { placement: "belowEditor" });
            // Generate questions
            const result = await modelClient.generateInterview(promptContext, config);
            // Check if we were superseded
            if (epoch !== generationEpoch) {
                ctx.ui.setWidget("interview-status", undefined);
                return;
            }
            if (result.skipped || result.questions.length === 0) {
                // Show brief skip notice then clear
                ctx.ui.setWidget("interview-status", [
                    `  ${ctx.ui.theme.fg("dim", `✦ no interview needed${result.skipReason ? ` — ${result.skipReason}` : ""}`)}`,
                ], { placement: "belowEditor" });
                setTimeout(() => {
                    ctx.ui.setWidget("interview-status", undefined);
                }, 3000);
                return;
            }
            // Clear loading indicator
            ctx.ui.setWidget("interview-status", undefined);
            // Show usage info
            if (result.usage) {
                const cost = result.usage.costTotal
                    ? ` $${result.usage.costTotal.toFixed(4)}`
                    : "";
                ctx.ui.setStatus("interview", `✦ interview: ${result.usage.totalTokens} tokens${cost}`);
            }
            // Show interactive questionnaire
            const submission = await showInterviewUI(ctx, result.questions, config);
            // Clear status
            ctx.ui.setStatus("interview", undefined);
            // Handle result
            if (submission.cancelled) {
                return;
            }
            if (submission.composedPrompt) {
                // Inject composed prompt into editor
                ctx.ui.setEditorText(submission.composedPrompt);
            }
        }
        catch (error) {
            ctx.ui.setWidget("interview-status", undefined);
            const msg = error instanceof Error ? error.message : String(error);
            ctx.ui.notify(`interview error: ${msg.slice(0, 100)}`, "error");
        }
        finally {
            interviewActive = false;
        }
    }
    // ─── Event Hooks ──────────────────────────────────────────────────────
    pi.on("session_start", async (_event, ctx) => {
        currentContext = ctx;
        generationEpoch++;
    });
    pi.on("session_switch", async (_event, ctx) => {
        currentContext = ctx;
        generationEpoch++;
        interviewActive = false;
    });
    pi.on("session_fork", async (_event, ctx) => {
        currentContext = ctx;
        generationEpoch++;
        interviewActive = false;
    });
    pi.on("agent_end", async (event, ctx) => {
        currentContext = ctx;
        const epoch = ++generationEpoch;
        if (config.mode !== "auto")
            return;
        // Build turn context from event messages
        const branchEntries = ctx.sessionManager.getBranch();
        const branchMessages = branchEntries
            .filter((entry) => entry.type === "message")
            .map((entry) => entry.message);
        const sourceLeafId = ctx.sessionManager.getLeafId() ?? `turn-${Date.now()}`;
        const turn = buildTurnContext({
            turnId: sourceLeafId,
            sourceLeafId,
            messagesFromPrompt: event.messages,
            branchMessages: branchMessages,
            occurredAt: new Date().toISOString(),
        });
        if (!turn)
            return;
        lastTurnContext = turn;
        await runInterview(turn, ctx, epoch);
    });
    // Bump epoch on new user input to cancel pending interviews
    pi.on("input", async (_event, ctx) => {
        currentContext = ctx;
        generationEpoch++;
        ctx.ui.setWidget("interview-status", undefined);
        return { action: "continue" };
    });
    // ─── Commands ─────────────────────────────────────────────────────────
    pi.registerCommand("interview", {
        description: "Interview: ask | status | config <key> <value>",
        handler: async (args, ctx) => {
            currentContext = ctx;
            const [subcommand, ...rest] = args.trim().split(/\s+/);
            if (!subcommand || subcommand === "ask") {
                // Manual trigger — use last turn context or build from branch
                let turn = lastTurnContext;
                if (!turn) {
                    const branchEntries = ctx.sessionManager
                        .getBranch()
                        .filter((entry) => entry.type === "message");
                    turn = buildTurnContextFromBranch(branchEntries) ?? undefined;
                }
                if (!turn) {
                    ctx.ui.notify("No conversation context for interview", "warning");
                    return;
                }
                const epoch = ++generationEpoch;
                await runInterview(turn, ctx, epoch);
                return;
            }
            if (subcommand === "status") {
                const lines = [
                    `mode: ${config.mode}`,
                    `model: ${config.model}`,
                    `maxQuestions: ${config.maxQuestions}`,
                    `maxOptions: ${config.maxOptions}`,
                    `skipOnSimpleResponse: ${config.skipOnSimpleResponse}`,
                    `autoSubmitQuickActions: ${config.autoSubmitQuickActions}`,
                    `thinkingLevel: ${config.thinkingLevel}`,
                ];
                if (config.customInstruction) {
                    lines.push(`customInstruction: "${config.customInstruction}"`);
                }
                pi.sendMessage({
                    customType: "interview-status",
                    content: `✦ pi-interview config\n${lines.join("\n")}`,
                    display: true,
                }, { triggerTurn: false });
                return;
            }
            if (subcommand === "config") {
                const key = rest[0];
                const value = rest.slice(1).join(" ");
                if (!key) {
                    ctx.ui.notify("Usage: /interview config <key> <value>", "info");
                    return;
                }
                switch (key) {
                    case "mode":
                        if (value === "auto" || value === "manual") {
                            config.mode = value;
                            ctx.ui.notify(`interview mode: ${value}`, "info");
                        }
                        break;
                    case "model":
                        config.model = value || DEFAULT_CONFIG.model;
                        ctx.ui.notify(`interview model: ${config.model}`, "info");
                        break;
                    case "maxQuestions":
                        config.maxQuestions = Math.max(1, Math.min(5, parseInt(value) || DEFAULT_CONFIG.maxQuestions));
                        ctx.ui.notify(`interview maxQuestions: ${config.maxQuestions}`, "info");
                        break;
                    case "maxOptions":
                        config.maxOptions = Math.max(2, Math.min(8, parseInt(value) || DEFAULT_CONFIG.maxOptions));
                        ctx.ui.notify(`interview maxOptions: ${config.maxOptions}`, "info");
                        break;
                    case "skip":
                        config.skipOnSimpleResponse = value !== "false";
                        ctx.ui.notify(`interview skipOnSimpleResponse: ${config.skipOnSimpleResponse}`, "info");
                        break;
                    case "thinking":
                        if (["off", "minimal", "low"].includes(value)) {
                            config.thinkingLevel = value;
                            ctx.ui.notify(`interview thinkingLevel: ${config.thinkingLevel}`, "info");
                        }
                        break;
                    case "instruction":
                        config.customInstruction = value;
                        ctx.ui.notify(value
                            ? `interview instruction: "${value}"`
                            : "interview instruction cleared", "info");
                        break;
                    default:
                        ctx.ui.notify(`Unknown config key: ${key}`, "warning");
                }
                return;
            }
            ctx.ui.notify("Usage: /interview [ask | status | config <key> <value>]", "info");
        },
    });
    // ─── Keyboard Shortcut ────────────────────────────────────────────────
    pi.registerShortcut("ctrl+i", {
        description: "Trigger interview",
        handler: async (ctx) => {
            currentContext = ctx;
            let turn = lastTurnContext;
            if (!turn) {
                const branchEntries = ctx.sessionManager
                    .getBranch()
                    .filter((entry) => entry.type === "message");
                turn = buildTurnContextFromBranch(branchEntries) ?? undefined;
            }
            if (!turn) {
                ctx.ui.notify("No conversation context for interview", "warning");
                return;
            }
            const epoch = ++generationEpoch;
            await runInterview(turn, ctx, epoch);
        },
    });
}
//# sourceMappingURL=index.js.map