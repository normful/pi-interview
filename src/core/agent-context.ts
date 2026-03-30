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

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const AGENTS_DIR = join(homedir(), ".agents");

interface RuleEntry {
  file: string;
  triggers?: string[];
  summary?: string;
}

interface SkillEntry {
  name: string;
  description?: string;
  triggers?: string[];
  location?: string;
  lines?: number;
}

interface ProjectEntry {
  name: string;
  emoji?: string;
  team?: string;
  color?: string;
}

export interface AgentContext {
  /** Active rule file names + summaries */
  rules: { name: string; summary: string }[];
  /** Available skill names + short descriptions */
  skills: { name: string; description: string }[];
  /** Known projects */
  projects: { name: string; emoji?: string; team?: string }[];
}

async function tryReadJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Build agent context from ~/.agents. Fast and non-critical.
 * Returns null if ~/.agents is not accessible.
 */
export async function buildAgentContext(): Promise<AgentContext | null> {
  // Formats: { version, generated, rules: { name: { file, summary, triggers } } }
  //          { version, generated, skills: { name: { description, trigger } } }
  //          { name: { name, emoji, team } } or array
  const [rulesFile, skillsFile, projectsRaw] = await Promise.all([
    tryReadJson<{ rules?: Record<string, RuleEntry> }>(join(AGENTS_DIR, "rules.index.json")),
    tryReadJson<{ skills?: Record<string, SkillEntry> }>(join(AGENTS_DIR, "skills.index.json")),
    tryReadJson<{ projects?: Record<string, ProjectEntry> }>(join(AGENTS_DIR, "projects.json")),
  ]);

  if (!rulesFile && !skillsFile && !projectsRaw) return null;

  const rulesMap = rulesFile?.rules ?? {};
  const rules = Object.entries(rulesMap)
    .filter(([_, v]) => v.summary)
    .map(([k, v]) => ({
      name: k.replace(/\.md$/, ""),
      summary: v.summary || "",
    }))
    .slice(0, 15);

  const skillsMap = skillsFile?.skills ?? {};
  const skills = Object.entries(skillsMap)
    .filter(([_, v]) => v.description)
    .map(([k, v]) => ({
      name: k,
      description: (v.description || "").slice(0, 120),
    }))
    .slice(0, 20);

  const projectsMap = projectsRaw?.projects ?? {};
  const projects = Object.values(projectsMap)
    .filter((p) => typeof p === "object" && p?.name)
    .map((p) => ({
      name: p.name,
      emoji: p.emoji,
      team: (p as any).linearTeam,
    }))
    .slice(0, 10);

  return { rules, skills, projects };
}

/**
 * Format agent context as compact string for the prompt.
 */
export function formatAgentContext(ctx: AgentContext): string {
  const lines: string[] = [];

  if (ctx.projects.length > 0) {
    lines.push(
      `Projects: ${ctx.projects.map((p) => `${p.emoji || ""} ${p.name}${p.team ? ` (${p.team})` : ""}`).join(", ")}`
    );
  }

  if (ctx.skills.length > 0) {
    lines.push(
      `Skills: ${ctx.skills.map((s) => s.name).join(", ")}`
    );
  }

  if (ctx.rules.length > 0) {
    lines.push(
      `Rules: ${ctx.rules.map((r) => r.name).join(", ")}`
    );
  }

  return lines.join("\n");
}
