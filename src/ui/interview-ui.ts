/**
 * Interview UI component for pi TUI.
 *
 * Renders as a widget below the editor (not a modal) showing:
 * - Multiple choice questions with ↑↓ navigation
 * - Optional text input for notes
 * - Tab to navigate between questions
 * - Enter to accept, Esc to dismiss
 *
 * Inspired by pi's questionnaire.ts example but adapted for the
 * non-blocking widget-below-editor pattern.
 */

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type {
  InterviewQuestion,
  InterviewAnswer,
  InterviewSubmission,
  InterviewConfig,
} from "../core/types.js";
import { composePrompt, buildSubmission } from "../prompts/compose-template.js";

interface InterviewUICallbacks {
  onSubmit: (submission: InterviewSubmission) => void;
  onDismiss: () => void;
}

/**
 * Show interview questions via ctx.ui.custom().
 * Returns the submission result.
 */
export async function showInterviewUI(
  ctx: ExtensionContext,
  questions: InterviewQuestion[],
  config: InterviewConfig
): Promise<InterviewSubmission> {
  const startTime = Date.now();

  if (!ctx.hasUI || questions.length === 0) {
    return buildSubmission(questions, [], config.maxPromptChars, startTime, true);
  }

  return ctx.ui.custom<InterviewSubmission>((tui, theme, _kb, done) => {
    // State
    let currentQuestion = 0;
    let optionIndex = 0;
    let textInput = "";
    let textMode = false;
    const answers = new Map<string, InterviewAnswer>();
    let cachedLines: string[] | undefined;

    function refresh() {
      cachedLines = undefined;
      tui.requestRender();
    }

    function q(): InterviewQuestion {
      return questions[currentQuestion];
    }

    function submit(cancelled: boolean) {
      const allAnswers: InterviewAnswer[] = questions.map((question) => {
        const existing = answers.get(question.id);
        return (
          existing ?? {
            questionId: question.id,
            skipped: true,
          }
        );
      });
      done(buildSubmission(questions, allAnswers, config.maxPromptChars, startTime, cancelled));
    }

    function selectOption() {
      const question = q();
      if (!question.options) return;

      const opt = question.options[optionIndex];
      if (!opt) return;

      if (question.type === "single") {
        answers.set(question.id, {
          questionId: question.id,
          selectedOptions: [opt.label],
          skipped: false,
        });

        // Auto-advance or submit
        if (questions.length === 1 && config.autoSubmitQuickActions) {
          submit(false);
          return;
        }
        advanceQuestion();
      } else if (question.type === "multi") {
        const existing = answers.get(question.id);
        const selected = existing?.selectedOptions ?? [];
        const idx = selected.indexOf(opt.label);
        if (idx >= 0) {
          selected.splice(idx, 1);
        } else {
          selected.push(opt.label);
        }
        answers.set(question.id, {
          questionId: question.id,
          selectedOptions: [...selected],
          skipped: selected.length === 0,
        });
        refresh();
      }
    }

    function advanceQuestion() {
      if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        optionIndex = 0;
        textInput = "";
        textMode = false;
      } else {
        // All questions answered — submit
        submit(false);
      }
      refresh();
    }

    function handleInput(data: string) {
      // Text input mode
      if (textMode || q().type === "text") {
        if (data === "\x1b" || data === "\x1b[D") {
          // Escape or left — exit text mode
          if (textMode) {
            textMode = false;
            refresh();
            return;
          }
          submit(true);
          return;
        }
        if (data === "\r" || data === "\n") {
          // Enter — save text and advance
          answers.set(q().id, {
            questionId: q().id,
            text: textInput.trim() || undefined,
            skipped: !textInput.trim(),
          });
          textMode = false;
          advanceQuestion();
          return;
        }
        if (data === "\x7f" || data === "\b") {
          // Backspace
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

      // Navigation
      if (data === "\x1b[A") {
        // Up
        optionIndex = Math.max(0, optionIndex - 1);
        refresh();
        return;
      }
      if (data === "\x1b[B") {
        // Down
        const opts = q().options ?? [];
        optionIndex = Math.min(opts.length, optionIndex + 1); // +1 for "type something" option
        refresh();
        return;
      }
      if (data === "\x1b[C" || data === "\t") {
        // Right / Tab — next question
        if (questions.length > 1 && currentQuestion < questions.length - 1) {
          currentQuestion++;
          optionIndex = 0;
          refresh();
        }
        return;
      }
      if (data === "\x1b[D" || data === "\x1b\t") {
        // Left / Shift-Tab — prev question
        if (currentQuestion > 0) {
          currentQuestion--;
          optionIndex = 0;
          refresh();
        }
        return;
      }

      // Enter — select
      if (data === "\r" || data === "\n") {
        const opts = q().options ?? [];
        if (optionIndex === opts.length) {
          // "Type something" option
          textMode = true;
          textInput = "";
          refresh();
          return;
        }
        selectOption();
        return;
      }

      // Space — also select for single
      if (data === " " && q().type === "single") {
        const opts = q().options ?? [];
        if (optionIndex < opts.length) {
          selectOption();
          return;
        }
      }

      // Escape — dismiss
      if (data === "\x1b") {
        submit(true);
        return;
      }

      // Number keys for quick select
      const num = parseInt(data, 10);
      if (!isNaN(num) && num >= 1) {
        const opts = q().options ?? [];
        if (num <= opts.length) {
          optionIndex = num - 1;
          selectOption();
          return;
        }
      }
    }

    function render(width: number): string[] {
      if (cachedLines) return cachedLines;

      const lines: string[] = [];
      const w = Math.max(20, width);

      // Header
      lines.push(theme.fg("accent", "─".repeat(w)));

      const title = questions.length > 1
        ? ` ✦ Interview (${currentQuestion + 1}/${questions.length})`
        : " ✦ Interview";
      lines.push(theme.fg("accent", theme.bold(title)));
      lines.push("");

      const question = q();

      // Question text
      lines.push(` ${theme.fg("text", question.text)}`);
      lines.push("");

      if (textMode || question.type === "text") {
        // Text input mode
        const placeholder = question.placeholder || "Type your instruction...";
        const displayText = textInput || theme.fg("dim", placeholder);
        lines.push(` ${theme.fg("muted", "▸")} ${displayText}${theme.fg("accent", "█")}`);
        lines.push("");
        lines.push(theme.fg("dim", " Enter to submit · Esc to cancel"));
      } else if (question.options) {
        // Options
        const opts = question.options;
        const selected = answers.get(question.id)?.selectedOptions ?? [];

        for (let i = 0; i < opts.length; i++) {
          const opt = opts[i];
          const isSelected = i === optionIndex;
          const isChecked = selected.includes(opt.label);

          const prefix = isSelected
            ? theme.fg("accent", "▸ ")
            : "  ";

          const checkbox = question.type === "multi"
            ? (isChecked ? theme.fg("success", "■ ") : theme.fg("dim", "□ "))
            : "";

          const label = isSelected
            ? theme.fg("accent", `${i + 1}. ${opt.label}`)
            : theme.fg("text", `${i + 1}. ${opt.label}`);

          lines.push(`${prefix}${checkbox}${label}`);

          if (opt.description) {
            lines.push(`     ${theme.fg("dim", opt.description)}`);
          }
        }

        // "Type something" option
        const isTypeSelected = optionIndex === opts.length;
        const typePrefix = isTypeSelected
          ? theme.fg("accent", "▸ ")
          : "  ";
        const typeLabel = isTypeSelected
          ? theme.fg("accent", `${opts.length + 1}. Type something else...`)
          : theme.fg("muted", `${opts.length + 1}. Type something else...`);
        lines.push(`${typePrefix}${typeLabel}`);

        lines.push("");

        // Navigation hints
        const hints: string[] = [];
        hints.push("↑↓ select");
        if (question.type === "single") hints.push("Enter/# accept");
        if (question.type === "multi") hints.push("Enter toggle · Tab next");
        if (questions.length > 1) hints.push("Tab/←→ navigate");
        hints.push("Esc dismiss");
        lines.push(theme.fg("dim", ` ${hints.join(" · ")}`));
      }

      // Answered summary (for multi-question)
      if (questions.length > 1) {
        const answeredCount = questions.filter((q) => answers.has(q.id)).length;
        if (answeredCount > 0) {
          lines.push("");
          lines.push(
            theme.fg("dim", ` Answered: ${answeredCount}/${questions.length}`)
          );
        }
      }

      lines.push(theme.fg("accent", "─".repeat(w)));

      cachedLines = lines;
      return lines;
    }

    return {
      render,
      invalidate: () => {
        cachedLines = undefined;
      },
      handleInput,
    };
  });
}
