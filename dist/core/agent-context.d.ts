/**
 * Agent context enrichment — pulls from ~/.agents for richer interview questions.
 *
 * Reads:
 * - rules.index.json → active rule names + summaries
 * - skills.index.json → available skill names + descriptions
 * - projects.json → project names, teams, emoji
 *
 * All reads are fast (<50ms) and non-critical — failures are silent.
 */
export interface AgentContext {
    /** Active rule file names + summaries */
    rules: {
        name: string;
        summary: string;
    }[];
    /** Available skill names + short descriptions */
    skills: {
        name: string;
        description: string;
    }[];
    /** Known projects */
    projects: {
        name: string;
        emoji?: string;
        team?: string;
    }[];
}
/**
 * Build agent context from ~/.agents. Fast and non-critical.
 * Returns null if ~/.agents is not accessible.
 */
export declare function buildAgentContext(): Promise<AgentContext | null>;
/**
 * Format agent context as compact string for the prompt.
 */
export declare function formatAgentContext(ctx: AgentContext): string;
//# sourceMappingURL=agent-context.d.ts.map