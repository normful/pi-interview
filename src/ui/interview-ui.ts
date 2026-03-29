/**
 * Quiz UI — always multiple choice.
 *
 * Every question shows numbered options + "Type something else..." at the bottom.
 * Single question → selecting auto-submits. Multiple → Tab between, Enter to confirm.
 */

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type {
  QuizQuestion,
  QuizAnswer,
  QuizSubmission,
  QuizConfig,
} from "../core/types.js";
import { buildSubmission } from "../prompts/compose-template.js";

export async function showQuizUI(
  ctx: ExtensionContext,
  questions: QuizQuestion[],
  config: QuizConfig
): Promise<QuizSubmission> {
  const startTime = Date.now();

  if (!ctx.hasUI || questions.length === 0) {
    return buildSubmission(questions, [], config.maxPromptChars, startTime, true);
  }

  return ctx.ui.custom<QuizSubmission>((tui, theme, _kb, done) => {
    let currentQ = 0;
    let optionIdx = 0;
    let textMode = false;
    let textInput = "";
    const answers = new Map<string, QuizAnswer>();
    let cachedLines: string[] | undefined;

    function refresh() {
      cachedLines = undefined;
      tui.requestRender();
    }

    function q(): QuizQuestion {
      return questions[currentQ];
    }

    /** Total selectable rows: options + "Type something else..." */
    function rowCount(): number {
      return q().options.length + 1;
    }

    function submit(cancelled: boolean) {
      const allAnswers: QuizAnswer[] = questions.map((question) => {
        return answers.get(question.id) ?? { questionId: question.id, skipped: true };
      });
      done(buildSubmission(questions, allAnswers, config.maxPromptChars, startTime, cancelled));
    }

    function selectOption() {
      const question = q();
      const opt = question.options[optionIdx];
      if (!opt) return;

      if (question.type === "single") {
        answers.set(question.id, {
          questionId: question.id,
          selectedOptions: [opt.label],
          skipped: false,
        });
        // Single question → auto submit; multi-question → advance
        if (questions.length === 1 && config.autoSubmitSingle) {
          submit(false);
          return;
        }
        advance();
      } else {
        // Multi: toggle
        const existing = answers.get(question.id);
        const selected = existing?.selectedOptions ? [...existing.selectedOptions] : [];
        const idx = selected.indexOf(opt.label);
        if (idx >= 0) selected.splice(idx, 1);
        else selected.push(opt.label);
        answers.set(question.id, {
          questionId: question.id,
          selectedOptions: selected,
          skipped: selected.length === 0,
        });
        refresh();
      }
    }

    function advance() {
      if (currentQ < questions.length - 1) {
        currentQ++;
        optionIdx = 0;
        textMode = false;
        textInput = "";
      } else {
        submit(false);
      }
      refresh();
    }

    function handleInput(data: string) {
      // ── Text mode ──
      if (textMode) {
        if (data === "\x1b") {
          textMode = false;
          refresh();
          return;
        }
        if (data === "\r" || data === "\n") {
          if (textInput.trim()) {
            answers.set(q().id, {
              questionId: q().id,
              text: textInput.trim(),
              skipped: false,
            });
          }
          textMode = false;
          textInput = "";
          if (questions.length === 1 && config.autoSubmitSingle) {
            submit(false);
          } else {
            advance();
          }
          return;
        }
        if (data === "\x7f" || data === "\b") {
          textInput = textInput.slice(0, -1);
          refresh();
          return;
        }
        if (data.length === 1 && data.charCodeAt(0) >= 32) {
          textInput += data;
          refresh();
          return;
        }
        return;
      }

      // ── Navigation ──
      if (data === "\x1b[A") { // Up
        optionIdx = Math.max(0, optionIdx - 1);
        refresh();
        return;
      }
      if (data === "\x1b[B") { // Down
        optionIdx = Math.min(rowCount() - 1, optionIdx + 1);
        refresh();
        return;
      }
      if (data === "\t" || data === "\x1b[C") { // Tab / Right
        if (questions.length > 1) {
          currentQ = (currentQ + 1) % questions.length;
          optionIdx = 0;
          refresh();
        }
        return;
      }
      if (data === "\x1b\t" || data === "\x1b[D") { // Shift-Tab / Left
        if (questions.length > 1) {
          currentQ = (currentQ - 1 + questions.length) % questions.length;
          optionIdx = 0;
          refresh();
        }
        return;
      }

      // ── Select ──
      if (data === "\r" || data === "\n") {
        if (optionIdx === q().options.length) {
          // "Type something else..."
          textMode = true;
          textInput = "";
          refresh();
          return;
        }
        selectOption();
        return;
      }

      // Space also selects for single
      if (data === " " && q().type === "single" && optionIdx < q().options.length) {
        selectOption();
        return;
      }

      // ── Number keys ──
      const num = parseInt(data, 10);
      if (!isNaN(num) && num >= 1 && num <= q().options.length) {
        optionIdx = num - 1;
        selectOption();
        return;
      }

      // ── Multi: confirm selection and advance ──
      if (data === "\r" && q().type === "multi") {
        advance();
        return;
      }

      // ── Escape ──
      if (data === "\x1b") {
        submit(true);
        return;
      }
    }

    function render(width: number): string[] {
      if (cachedLines) return cachedLines;

      const lines: string[] = [];
      const w = Math.max(20, width);
      const question = q();
      const selected = answers.get(question.id)?.selectedOptions ?? [];

      // Header
      lines.push(theme.fg("accent", "─".repeat(w)));

      // Title with question counter
      if (questions.length > 1) {
        const dots = questions.map((_, i) => {
          const answered = answers.has(questions[i].id);
          const active = i === currentQ;
          const dot = answered ? "●" : "○";
          return active ? theme.fg("accent", dot) : theme.fg("dim", dot);
        }).join(" ");
        lines.push(` ${theme.fg("accent", "✦")} ${dots}`);
      } else {
        lines.push(` ${theme.fg("accent", "✦")}`);
      }

      // Question text
      lines.push(` ${theme.fg("text", theme.bold(question.text))}`);
      lines.push("");

      if (textMode) {
        // Freeform input
        const display = textInput || theme.fg("dim", "Type your instruction...");
        lines.push(`  ${theme.fg("accent", "▸")} ${display}${theme.fg("accent", "█")}`);
        lines.push("");
        lines.push(theme.fg("dim", "  Enter submit · Esc back"));
      } else {
        // Options
        const opts = question.options;
        for (let i = 0; i < opts.length; i++) {
          const opt = opts[i];
          const active = i === optionIdx;
          const checked = selected.includes(opt.label);

          const pointer = active ? theme.fg("accent", "▸") : " ";
          const check = question.type === "multi"
            ? (checked ? theme.fg("success", "■") : theme.fg("dim", "□"))
            : "";
          const num = theme.fg("dim", `${i + 1}`);
          const label = active
            ? theme.fg("accent", opt.label)
            : theme.fg("text", opt.label);

          lines.push(` ${pointer} ${check}${check ? " " : ""}${num} ${label}`);
          if (opt.description) {
            lines.push(`     ${theme.fg("dim", opt.description)}`);
          }
        }

        // "Type something else..." option
        const typeActive = optionIdx === opts.length;
        const pointer = typeActive ? theme.fg("accent", "▸") : " ";
        const label = typeActive
          ? theme.fg("accent", "Type something else...")
          : theme.fg("muted", "Type something else...");
        lines.push(` ${pointer}   ${label}`);

        lines.push("");

        // Hints
        const hints: string[] = ["↑↓ navigate"];
        if (question.type === "single") hints.push("Enter/#");
        if (question.type === "multi") hints.push("Enter toggle");
        if (questions.length > 1) hints.push("Tab next");
        hints.push("Esc dismiss");
        lines.push(theme.fg("dim", ` ${hints.join("  ·  ")}`));
      }

      lines.push(theme.fg("accent", "─".repeat(w)));

      cachedLines = lines;
      return lines;
    }

    return {
      render,
      invalidate: () => { cachedLines = undefined; },
      handleInput,
    };
  });
}
