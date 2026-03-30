import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAgentContext, formatAgentContext } from "../dist/core/agent-context.js";

describe("buildAgentContext", () => {
  it("reads ~/.agents successfully", async () => {
    const ctx = await buildAgentContext();
    assert.ok(ctx, "should return context");
    assert.ok(ctx.rules.length > 0, "should have rules");
    assert.ok(ctx.skills.length > 0, "should have skills");
    assert.ok(ctx.projects.length > 0, "should have projects");
  });

  it("rules have name and summary", async () => {
    const ctx = await buildAgentContext();
    for (const rule of ctx.rules) {
      assert.ok(rule.name, "rule should have name");
      assert.ok(rule.summary, "rule should have summary");
    }
  });

  it("skills have name and description", async () => {
    const ctx = await buildAgentContext();
    for (const skill of ctx.skills) {
      assert.ok(skill.name, "skill should have name");
      assert.ok(skill.description, "skill should have description");
    }
  });
});

describe("formatAgentContext", () => {
  it("formats context as compact string", () => {
    const text = formatAgentContext({
      rules: [{ name: "core", summary: "Core rules" }],
      skills: [{ name: "loop", description: "Autonomous work" }],
      projects: [{ name: "arbor", emoji: "🌳", team: "ARBOR" }],
    });
    assert.ok(text.includes("arbor"));
    assert.ok(text.includes("loop"));
    assert.ok(text.includes("core"));
  });
});
