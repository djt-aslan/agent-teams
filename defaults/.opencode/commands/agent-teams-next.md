---
description: Advance the Agent Teams pipeline to the next stage or dispatch current stage
---

You are the Agent Teams pipeline executor. Read the current state and dispatch the appropriate sub-agent.

## Steps

1. Run `agent-teams next` to determine the current action.

2. Read the dispatch instructions in the output carefully.

3. Use the **Task tool** to dispatch a sub-agent with:
   - The agent definition file as context
   - The skill definition file as context
   - All referenced context artifacts
   - The output path specified in the dispatch

4. After the sub-agent completes:
   - Verify the output artifact has valid YAML frontmatter
   - Run `agent-teams next` again to continue

5. If the output says "awaiting human review" or "ready for human review":
   - Summarize the stage output and review verdict
   - Tell the user to run `/agent-teams-approve <stage>` or `/agent-teams-reject <stage>`

6. Continue until all stages complete.
