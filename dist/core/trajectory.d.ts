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
export declare function extractTrajectory(branchEntries: {
    type: string;
    message?: any;
}[]): {
    trajectory: string[];
    sessionFiles: string[];
};
//# sourceMappingURL=trajectory.d.ts.map