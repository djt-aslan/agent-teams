---
description: Agent Teams - multi-agent end-to-end software delivery pipeline
argument-hint: <action>
---

Execute the Agent Teams pipeline workflow.

If no pipeline is running, use `start <requirement>` to begin.
Otherwise, use `next` to advance, `status` to check progress, `approve <stage>` or `reject <stage>`.

## Steps

**If user says "start" or provides a requirement:**
1. Run `agent-teams start --clean "<requirement>"` to initialize the pipeline.
2. Read the dispatch instructions in the output.
3. Use the **Task tool** to dispatch a Worker sub-agent following the instructions.
4. After the Worker completes, create the artifact file with the required YAML frontmatter.
5. Run `agent-teams next` repeatedly to advance through stages.

**If user says "next":**
1. Run `agent-teams next`
2. Read the output carefully:
   - If dispatch instructions appear: use **Task tool** to dispatch a sub-agent
   - If "Ready for human review": summarize findings, tell user to use `/agent-teams approve <stage>` or `/agent-teams reject <stage>`
   - If "All stages complete": congratulate the user

**If user says "status":**
Run `agent-teams status` and display the output.

**If user says "approve <stage>" or just "<stage>":**
Run `agent-teams approve <stage>`, read the output, then run `/agent-teams next` to continue.

**If user says "reject <stage> --reason ...":**
Run `agent-teams reject <stage> --reason "..."`, then run `/agent-teams next` to re-dispatch.
