/**
 * Session trajectory extraction.
 *
 * Builds a condensed summary of what happened across the full session,
 * not just the current turn. Gives the question generator awareness of
 * the arc of work — what was built, what failed, what direction shifted.
 */

/**
 * Extract trajectory from session branch entries.
 * Returns condensed turn summaries (newest last) and all unique files touched.
 */
export function extractTrajectory(
  branchEntries: { type: string; message?: any }[]
): { trajectory: string[]; sessionFiles: string[] } {
  const trajectory: string[] = [];
  const allFiles = new Set<string>();
  const messages = branchEntries
    .filter((e) => e.type === "message" && e.message)
    .map((e) => e.message);

  let currentUserPrompt = "";

  for (const msg of messages) {
    if (msg.role === "user") {
      const text = textFrom(msg.content);
      if (text.length > 5) {
        currentUserPrompt = text.slice(0, 120);
      }
    }

    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      // Extract tool calls for trajectory
      const tools: string[] = [];
      const files = new Set<string>();
      for (const block of msg.content) {
        if (block.type === "toolCall") {
          const args = block.arguments as Record<string, unknown> | undefined;
          const path = typeof args?.path === "string" ? args.path : undefined;
          const cmd = typeof args?.command === "string" ? args.command : undefined;
          tools.push(block.name + (path ? `(${basename(path)})` : ""));
          if (path) {
            files.add(path.replace(/^@/, ""));
            allFiles.add(path.replace(/^@/, ""));
          }
        }
      }

      if (currentUserPrompt && (tools.length > 0 || files.size > 0)) {
        const filesStr = files.size > 0 ? ` [${[...files].map(basename).join(", ")}]` : "";
        trajectory.push(`${currentUserPrompt}${filesStr}`);
        currentUserPrompt = "";
      }
    }
  }

  // Keep last 8 trajectory entries to stay under token budget
  return {
    trajectory: trajectory.slice(-8),
    sessionFiles: [...allFiles].slice(0, 20),
  };
}

function textFrom(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b: any) => b?.type === "text")
    .map((b: any) => String(b.text ?? ""))
    .join(" ")
    .trim();
}

function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}
