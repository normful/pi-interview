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
import { Key, matchesKey, truncateToWidth, wrapTextWithAnsi, } from "@mariozechner/pi-tui";
import { buildSubmission } from "../prompts/compose-template.js";
export async function showInterviewUI(ctx, questions, config) {
    const startTime = Date.now();
    if (!ctx.hasUI || questions.length === 0) {
        return buildSubmission(questions, [], config.maxPromptChars, startTime, true);
    }
    return ctx.ui.custom((tui, theme, _kb, done) => {
        let currentQ = 0;
        let optionCursor = 0;
        let noteMode = false;
        let noteText = "";
        let cachedLines;
        // Multi-select state: track toggled options per question
        const selections = new Map();
        const notes = new Map();
        for (const q of questions) {
            selections.set(q.id, new Set());
        }
        function refresh() {
            cachedLines = undefined;
            tui.requestRender();
        }
        function q() {
            return questions[currentQ];
        }
        function finish(cancelled) {
            const allAnswers = questions.map((question) => {
                const sel = selections.get(question.id);
                const selectedLabels = sel && sel.size > 0
                    ? [...sel].sort((a, b) => a - b).map((i) => question.options[i]?.label).filter(Boolean)
                    : undefined;
                const note = notes.get(question.id);
                return {
                    questionId: question.id,
                    selectedOptions: selectedLabels,
                    text: note,
                    skipped: !selectedLabels?.length && !note,
                };
            });
            done(buildSubmission(questions, allAnswers, config.maxPromptChars, startTime, cancelled));
        }
        function advance() {
            if (questions.length === 1) {
                finish(false);
                return;
            }
            // Move to next unanswered, or finish
            for (let i = currentQ + 1; i < questions.length; i++) {
                const sel = selections.get(questions[i].id);
                if (!sel || sel.size === 0) {
                    currentQ = i;
                    optionCursor = 0;
                    refresh();
                    return;
                }
            }
            // Check earlier unanswered
            for (let i = 0; i < currentQ; i++) {
                const sel = selections.get(questions[i].id);
                if (!sel || sel.size === 0) {
                    currentQ = i;
                    optionCursor = 0;
                    refresh();
                    return;
                }
            }
            // All have selections
            finish(false);
        }
        function handleInput(data) {
            // ── Note mode ──
            if (noteMode) {
                if (matchesKey(data, Key.escape)) {
                    // Save and exit note mode
                    const trimmed = noteText.trim();
                    if (trimmed)
                        notes.set(q().id, trimmed);
                    noteMode = false;
                    refresh();
                    return;
                }
                if (matchesKey(data, Key.enter)) {
                    const trimmed = noteText.trim();
                    if (trimmed)
                        notes.set(q().id, trimmed);
                    noteMode = false;
                    refresh();
                    return;
                }
                if (matchesKey(data, Key.backspace)) {
                    noteText = noteText.slice(0, -1);
                    refresh();
                    return;
                }
                if (data.length === 1 && data.charCodeAt(0) >= 32) {
                    noteText += data;
                    refresh();
                    return;
                }
                return;
            }
            // ── Escape: dismiss ──
            if (matchesKey(data, Key.escape)) {
                finish(true);
                return;
            }
            // ── 'n' key: toggle notes ──
            if (data === "n") {
                noteMode = true;
                noteText = notes.get(q().id) || "";
                refresh();
                return;
            }
            // ── Arrow navigation ──
            if (matchesKey(data, Key.up)) {
                optionCursor = Math.max(0, optionCursor - 1);
                refresh();
                return;
            }
            if (matchesKey(data, Key.down)) {
                optionCursor = Math.min(q().options.length - 1, optionCursor + 1);
                refresh();
                return;
            }
            // ── Tab: next question ──
            if (matchesKey(data, Key.tab)) {
                if (questions.length > 1) {
                    currentQ = (currentQ + 1) % questions.length;
                    optionCursor = 0;
                    refresh();
                }
                return;
            }
            if (matchesKey(data, Key.shift("tab"))) {
                if (questions.length > 1) {
                    currentQ = (currentQ - 1 + questions.length) % questions.length;
                    optionCursor = 0;
                    refresh();
                }
                return;
            }
            // ── Space: toggle checkbox ──
            if (matchesKey(data, Key.space)) {
                const sel = selections.get(q().id);
                if (sel.has(optionCursor)) {
                    sel.delete(optionCursor);
                }
                else {
                    sel.add(optionCursor);
                }
                refresh();
                return;
            }
            // ── Enter: confirm selection and advance ──
            if (matchesKey(data, Key.enter)) {
                const sel = selections.get(q().id);
                // If nothing selected, select current cursor item first
                if (sel.size === 0) {
                    sel.add(optionCursor);
                    refresh();
                }
                advance();
                return;
            }
            // ── Number keys: toggle specific option ──
            if (data.length === 1 && data >= "1" && data <= "9") {
                const num = parseInt(data, 10) - 1;
                if (num < q().options.length) {
                    const sel = selections.get(q().id);
                    if (sel.has(num))
                        sel.delete(num);
                    else
                        sel.add(num);
                    refresh();
                    return;
                }
            }
        }
        function render(width) {
            if (cachedLines)
                return cachedLines;
            const lines = [];
            const w = Math.max(20, width);
            const question = q();
            const sel = selections.get(question.id);
            // Helper: every line MUST be truncated to width to prevent TUI crash
            const add = (s) => lines.push(truncateToWidth(s, w));
            const blank = () => lines.push("");
            // Top border
            add(theme.fg("accent", "─".repeat(w)));
            // Progress dots
            if (questions.length > 1) {
                const dots = questions.map((qn, i) => {
                    const hasSelection = (selections.get(qn.id)?.size ?? 0) > 0;
                    const active = i === currentQ;
                    const dot = hasSelection ? "●" : "○";
                    const styled = active ? theme.fg("accent", dot) : theme.fg(hasSelection ? "success" : "dim", dot);
                    return styled;
                }).join(" ");
                add(` ${theme.fg("accent", "✦")} ${dots}`);
            }
            else {
                add(` ${theme.fg("accent", "✦")}`);
            }
            // Question text
            const qLines = wrapTextWithAnsi(theme.bold(question.text), w - 2);
            for (const ql of qLines) {
                add(` ${ql}`);
            }
            blank();
            // Options with checkboxes
            const opts = question.options;
            for (let i = 0; i < opts.length; i++) {
                const opt = opts[i];
                const isCursor = i === optionCursor;
                const isChecked = sel.has(i);
                const pointer = isCursor ? theme.fg("accent", " > ") : "   ";
                const box = isChecked ? theme.fg("success", "[x]") : theme.fg("muted", "[ ]");
                const num = theme.fg("dim", `${i + 1}`);
                const color = isCursor ? "accent" : isChecked ? "success" : "text";
                const optLines = wrapTextWithAnsi(opt.label, w - 12);
                for (let li = 0; li < optLines.length; li++) {
                    if (li === 0) {
                        add(`${pointer}${box} ${num} ${theme.fg(color, optLines[li])}`);
                    }
                    else {
                        add(`          ${theme.fg(color, optLines[li])}`);
                    }
                }
                if (opt.description) {
                    const descLines = wrapTextWithAnsi(opt.description, w - 12);
                    for (const dl of descLines) {
                        add(`          ${theme.fg("dim", dl)}`);
                    }
                }
            }
            // Selection count
            if (sel.size > 0) {
                blank();
                const selectedLabels = [...sel].sort((a, b) => a - b).map((i) => opts[i]?.label).filter(Boolean);
                add(`  ${theme.fg("success", `${sel.size} selected`)}`);
            }
            // Notes section
            blank();
            const existingNote = notes.get(question.id);
            if (noteMode) {
                const display = noteText || theme.fg("dim", "add a note...");
                add(`  notes: ${display}_`);
                add(theme.fg("dim", "  Enter/Esc save"));
            }
            else if (existingNote) {
                add(`  ${theme.fg("dim", "note: " + existingNote)}`);
            }
            // Help bar
            blank();
            if (!noteMode) {
                const hints = ["up/dn", "Space toggle", "Enter confirm", "n note"];
                if (questions.length > 1)
                    hints.push("Tab next");
                hints.push("Esc dismiss");
                add(theme.fg("dim", `  ${hints.join(" . ")}`));
            }
            // Bottom border
            add(theme.fg("accent", "─".repeat(w)));
            cachedLines = lines;
            return lines;
        }
        return {
            render,
            invalidate() { cachedLines = undefined; },
            handleInput,
        };
    });
}
//# sourceMappingURL=interview-ui.js.map