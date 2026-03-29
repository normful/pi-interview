/**
 * Conversation signal extraction — builds TurnContext from pi session data.
 * Adapted from pi-prompt-suggester's conversation-signals.ts with simplifications.
 */
import type { TurnContext } from "./types.js";
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
        cost?: {
            total?: number;
        };
    };
}
interface BranchEntry {
    id: string;
    type: string;
    message: AgentMessage;
}
/**
 * Build turn context from agent_end event messages + full branch.
 * Returns null if no usable assistant message found.
 */
export declare function buildTurnContext(params: {
    turnId: string;
    sourceLeafId: string;
    messagesFromPrompt: AgentMessage[];
    branchMessages: AgentMessage[];
    occurredAt: string;
}): TurnContext | null;
/**
 * Build turn context from the latest branch entries (for session restore).
 */
export declare function buildTurnContextFromBranch(branchEntries: BranchEntry[]): TurnContext | null;
export {};
//# sourceMappingURL=signals.d.ts.map