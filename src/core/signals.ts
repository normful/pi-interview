/**
 * Conversation signal extraction — builds TurnContext from pi session data.
 * Adapted from pi-prompt-suggester's conversation-signals.ts with simplifications.
 */

import type { TurnContext, TokenUsage } from "./types.js";

// Use loose types to avoid coupling to pi-agent-core's AgentMessage union
// which includes BashExecutionMessage (no content field).
interface AgentMessage {
  role: string;
  content?: unknown;
  stopReason?: string;
  timestamp?: number;
  toolName?: string;
  isError?: boolean;
  usage?: {
    input?: number;
    output?: number;
    totalTokens?: number;
    cost?: { total?: number };
  };
}

interface BranchEntry {
  id: string;
  type: string;
  message: AgentMessage;
}

function textFromContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (
        block &&
        typeof block === "object" &&
        "type" in block &&
        (block as { type?: string }).type === "text" &&
        "text" in block
      ) {
        return String((block as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("\n")
    .trim();
}

function extractToolSignals(messages: AgentMessage[]): {
  toolSignals: string[];
  touchedFiles: string[];
} {
  const toolSignals: string[] = [];
  const touchedFiles = new Set<string>();

  for (const message of messages) {
    if (message.role === "assistant" && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === "toolCall") {
          const args = block.arguments as Record<string, unknown>;
          const path =
            typeof args.path === "string" ? args.path : undefined;
          const file =
            typeof args.file === "string" ? args.file : undefined;
          const command =
            typeof args.command === "string" ? args.command : undefined;
          const target = path ?? file ?? command;
          toolSignals.push(`${block.name}${target ? `(${target})` : ""}`);
          if (path) touchedFiles.add(path.replace(/^@/, ""));
          if (file) touchedFiles.add(file.replace(/^@/, ""));
        }
      }
    }
    if (message.role === "toolResult" && message.isError) {
      toolSignals.push(`${message.toolName}:error`);
    }
  }

  return { toolSignals, touchedFiles: Array.from(touchedFiles) };
}

function extractUnresolvedQuestions(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.endsWith("?") && line.length > 10 && line.length < 300);
}

function extractUsage(message: AgentMessage): TokenUsage | undefined {
  const usage = message.usage;
  if (!usage) return undefined;
  return {
    inputTokens: Number(usage.input ?? 0),
    outputTokens: Number(usage.output ?? 0),
    totalTokens: Number(usage.totalTokens ?? 0),
    costTotal: Number(usage.cost?.total ?? 0),
  };
}

function extractRecentUserPrompts(messages: AgentMessage[]): string[] {
  return [...messages]
    .reverse()
    .filter((m) => m.role === "user")
    .map((m) => textFromContent(m.content))
    .filter(Boolean)
    .slice(0, 10);
}

/**
 * Build turn context from agent_end event messages + full branch.
 * Returns null if no usable assistant message found.
 */
export function buildTurnContext(params: {
  turnId: string;
  sourceLeafId: string;
  messagesFromPrompt: AgentMessage[];
  branchMessages: AgentMessage[];
  occurredAt: string;
}): TurnContext | null {
  const lastMessage = params.messagesFromPrompt.at(-1);
  if (!lastMessage) return null;

  const recentUserPrompts = extractRecentUserPrompts(params.branchMessages);
  const { toolSignals, touchedFiles } = extractToolSignals(
    params.messagesFromPrompt
  );

  if (lastMessage.role !== "assistant") {
    // Non-assistant ending (tool result, etc)
    return {
      turnId: params.turnId,
      sourceLeafId: params.sourceLeafId,
      assistantText: lastMessage.role === "toolResult" ? "[tool result]" : "[empty]",
      assistantUsage: undefined,
      status: lastMessage.isError ? "error" : "success",
      occurredAt: params.occurredAt,
      recentUserPrompts,
      toolSignals,
      touchedFiles,
      unresolvedQuestions: [],
      abortContextNote: undefined,
    };
  }

  const assistantText = textFromContent(lastMessage.content);
  const status =
    lastMessage.stopReason === "error"
      ? "error"
      : lastMessage.stopReason === "aborted"
        ? "aborted"
        : "success";

  return {
    turnId: params.turnId,
    sourceLeafId: params.sourceLeafId,
    assistantText,
    assistantUsage: extractUsage(lastMessage),
    status,
    occurredAt: params.occurredAt,
    recentUserPrompts,
    toolSignals,
    touchedFiles,
    unresolvedQuestions: extractUnresolvedQuestions(assistantText),
    abortContextNote:
      status === "aborted"
        ? "User interrupted the previous turn. Ask about next direction."
        : undefined,
  };
}

/**
 * Build turn context from the latest branch entries (for session restore).
 */
export function buildTurnContextFromBranch(
  branchEntries: BranchEntry[]
): TurnContext | null {
  // Find the last non-user message
  let lastRelevantIndex = -1;
  for (let i = branchEntries.length - 1; i >= 0; i--) {
    if (branchEntries[i]?.message.role !== "user") {
      lastRelevantIndex = i;
      break;
    }
  }
  if (lastRelevantIndex === -1) return null;

  const latestEntry = branchEntries[lastRelevantIndex];
  const branchMessages = branchEntries.map((e) => e.message);

  // Find where this prompt group starts
  let startIndex = 0;
  for (let i = lastRelevantIndex - 1; i >= 0; i--) {
    if (branchEntries[i]?.message.role === "user") {
      startIndex = i + 1;
      break;
    }
  }

  const occurredAt =
    typeof latestEntry.message.timestamp === "number"
      ? new Date(latestEntry.message.timestamp).toISOString()
      : new Date().toISOString();

  return buildTurnContext({
    turnId: latestEntry.id,
    sourceLeafId: latestEntry.id,
    messagesFromPrompt: branchMessages.slice(
      startIndex,
      lastRelevantIndex + 1
    ),
    branchMessages,
    occurredAt,
  });
}
