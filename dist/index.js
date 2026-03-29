/**
 * pi-quiz — Multiple-choice next-prompt quiz for pi.
 *
 * After each agent turn, generates structured multiple-choice questions
 * to help the user decide what to do next. Every question has options.
 *
 * Ctrl+Q to trigger manually. /quiz for commands.
 */
import { completeSimple } from "@mariozechner/pi-ai";
import { buildTurnContext, buildTurnContextFromBranch } from "./core/signals.js";
import { buildQuizPromptContext } from "./prompts/interview-template.js";
import { QuizModelClient } from "./adapters/model-client.js";
import { showQuizUI } from "./ui/interview-ui.js";
import { DEFAULT_CONFIG } from "./core/types.js";
export default function quiz(pi) {
    let config = { ...DEFAULT_CONFIG };
    let currentContext;
    let lastTurnContext;
    let quizActive = false;
    let epoch = 0;
    const modelClient = new QuizModelClient({ getContext: () => currentContext }, completeSimple);
    // ─── Core Flow ────────────────────────────────────────────────────────
    async function runQuiz(turn, ctx, currentEpoch) {
        if (!ctx.hasUI || quizActive)
            return;
        if (currentEpoch !== epoch)
            return;
        // Skip trivially short responses
        if (config.skipOnSimpleResponse &&
            turn.assistantText.length < 100 &&
            turn.unresolvedQuestions.length === 0 &&
            turn.status === "success") {
            return;
        }
        quizActive = true;
        try {
            const promptContext = buildQuizPromptContext(turn, config);
            ctx.ui.setWidget("quiz-status", [
                `  ${ctx.ui.theme.fg("dim", "✦ generating quiz...")}`,
            ], { placement: "belowEditor" });
            const result = await modelClient.generateQuiz(promptContext, config);
            if (currentEpoch !== epoch) {
                ctx.ui.setWidget("quiz-status", undefined);
                return;
            }
            if (result.skipped || result.questions.length === 0) {
                ctx.ui.setWidget("quiz-status", [
                    `  ${ctx.ui.theme.fg("dim", `✦ skipped${result.skipReason ? ` — ${result.skipReason}` : ""}`)}`,
                ], { placement: "belowEditor" });
                setTimeout(() => ctx.ui.setWidget("quiz-status", undefined), 2500);
                return;
            }
            ctx.ui.setWidget("quiz-status", undefined);
            if (result.usage) {
                const cost = result.usage.costTotal ? ` $${result.usage.costTotal.toFixed(4)}` : "";
                ctx.ui.setStatus("quiz", `✦ quiz: ${result.usage.totalTokens} tok${cost}`);
            }
            const submission = await showQuizUI(ctx, result.questions, config);
            ctx.ui.setStatus("quiz", undefined);
            if (!submission.cancelled && submission.composedPrompt) {
                ctx.ui.setEditorText(submission.composedPrompt);
            }
        }
        catch (error) {
            ctx.ui.setWidget("quiz-status", undefined);
            const msg = error instanceof Error ? error.message : String(error);
            ctx.ui.notify(`quiz error: ${msg.slice(0, 80)}`, "error");
        }
        finally {
            quizActive = false;
        }
    }
    // ─── Helpers ──────────────────────────────────────────────────────────
    function getTurnFromBranch(ctx) {
        const branchEntries = ctx.sessionManager
            .getBranch()
            .filter((e) => e.type === "message");
        return buildTurnContextFromBranch(branchEntries) ?? undefined;
    }
    // ─── Events ───────────────────────────────────────────────────────────
    pi.on("session_start", async (_ev, ctx) => { currentContext = ctx; epoch++; });
    pi.on("session_switch", async (_ev, ctx) => { currentContext = ctx; epoch++; quizActive = false; });
    pi.on("session_fork", async (_ev, ctx) => { currentContext = ctx; epoch++; quizActive = false; });
    pi.on("agent_end", async (event, ctx) => {
        currentContext = ctx;
        const e = ++epoch;
        if (config.mode !== "auto")
            return;
        const branchEntries = ctx.sessionManager.getBranch();
        const branchMessages = branchEntries
            .filter((entry) => entry.type === "message")
            .map((entry) => entry.message);
        const leafId = ctx.sessionManager.getLeafId() ?? `turn-${Date.now()}`;
        const turn = buildTurnContext({
            turnId: leafId,
            sourceLeafId: leafId,
            messagesFromPrompt: event.messages,
            branchMessages: branchMessages,
            occurredAt: new Date().toISOString(),
        });
        if (!turn)
            return;
        lastTurnContext = turn;
        await runQuiz(turn, ctx, e);
    });
    pi.on("input", async (_ev, ctx) => {
        currentContext = ctx;
        epoch++;
        ctx.ui.setWidget("quiz-status", undefined);
        return { action: "continue" };
    });
    // ─── Commands ─────────────────────────────────────────────────────────
    pi.registerCommand("quiz", {
        description: "Quiz: ask | status | config <key> <value>",
        handler: async (args, ctx) => {
            currentContext = ctx;
            const [sub, ...rest] = args.trim().split(/\s+/);
            if (!sub || sub === "ask") {
                const turn = lastTurnContext ?? getTurnFromBranch(ctx);
                if (!turn) {
                    ctx.ui.notify("No conversation context for quiz", "warning");
                    return;
                }
                const e = ++epoch;
                await runQuiz(turn, ctx, e);
                return;
            }
            if (sub === "status") {
                pi.sendMessage({
                    customType: "quiz-status",
                    content: `✦ pi-quiz\nmode: ${config.mode} · model: ${config.model}\nmaxQ: ${config.maxQuestions} · maxOpts: ${config.maxOptions}\nskip: ${config.skipOnSimpleResponse} · autoSubmit: ${config.autoSubmitSingle}`,
                    display: true,
                }, { triggerTurn: false });
                return;
            }
            if (sub === "config") {
                const key = rest[0];
                const val = rest.slice(1).join(" ");
                if (!key) {
                    ctx.ui.notify("/quiz config <key> <value>", "info");
                    return;
                }
                switch (key) {
                    case "mode":
                        if (val === "auto" || val === "manual") {
                            config.mode = val;
                            ctx.ui.notify(`quiz mode: ${val}`, "info");
                        }
                        break;
                    case "model":
                        config.model = val || DEFAULT_CONFIG.model;
                        ctx.ui.notify(`quiz model: ${config.model}`, "info");
                        break;
                    case "maxQuestions":
                        config.maxQuestions = Math.max(1, Math.min(5, parseInt(val) || 3));
                        ctx.ui.notify(`quiz maxQuestions: ${config.maxQuestions}`, "info");
                        break;
                    case "maxOptions":
                        config.maxOptions = Math.max(2, Math.min(8, parseInt(val) || 5));
                        ctx.ui.notify(`quiz maxOptions: ${config.maxOptions}`, "info");
                        break;
                    case "skip":
                        config.skipOnSimpleResponse = val !== "false";
                        ctx.ui.notify(`quiz skip: ${config.skipOnSimpleResponse}`, "info");
                        break;
                    case "instruction":
                        config.customInstruction = val;
                        ctx.ui.notify(val ? `quiz instruction: "${val}"` : "quiz instruction cleared", "info");
                        break;
                    default:
                        ctx.ui.notify(`Unknown: ${key}`, "warning");
                }
                return;
            }
            ctx.ui.notify("/quiz [ask | status | config <key> <value>]", "info");
        },
    });
    // ─── Shortcut ─────────────────────────────────────────────────────────
    pi.registerShortcut("ctrl+q", {
        description: "Trigger quiz",
        handler: async (ctx) => {
            currentContext = ctx;
            const turn = lastTurnContext ?? getTurnFromBranch(ctx);
            if (!turn) {
                ctx.ui.notify("No conversation context", "warning");
                return;
            }
            const e = ++epoch;
            await runQuiz(turn, ctx, e);
        },
    });
}
//# sourceMappingURL=index.js.map