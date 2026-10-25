---
name: team-debug
description: "Explicit team workflow debug: diagnose and fix a bug through an evidence-led feedback loop"
---
Read AGENTS.md and .opencode/commands/debug.md. Apply that canonical command to the user's current arguments; treat its OpenCode frontmatter as metadata, not Codex configuration. Replace the literal $ARGUMENTS placeholder with the supplied task, change, ticket or module. Never run an OpenCode/Claude CLI to execute this workflow.

The main Codex session is the sole writer/orchestrator; read .opencode/agents/orchestrator.md for coordination instructions when needed, not as a child-agent definition. Specialist aliases: architect → architect, reviewer → reviewer, test-designer → test_designer, explore → built-in explorer. Delegate sequentially only when the workflow needs it and host policy permits; if independent review cannot run, report it pending instead of inventing PASS.

Names such as /bugfix or /test-module in canonical instructions are workflow labels. In Codex invoke the corresponding $team-* skill or follow that command file directly. Load only relevant procedural skills. Retain the canonical tests-only exception: no production/spec/doc edits, no artificial RED.
