# Agent Teams

AI Agent Teams for end-to-end software delivery. A TypeScript CLI tool that orchestrates AI agents through the full development lifecycle: requirements, design, implementation, testing, and deployment.

## Install

```bash
npm install -g @djt-aslan/agent-teams
# or from GitHub
npm install -g github:djt-aslan/agent-teams
```

## Quick Start

```bash
# Initialize in your project
agent-teams init

# Start a pipeline
agent-teams start "build a user authentication API"

# Advance through stages
agent-teams next

# Check progress
agent-teams status

# Approve/reject stages after human review
agent-teams approve prd
agent-teams reject architecture --reason "missing scalability section"
```

## Pipeline

```
requirement → prd → architecture → test-plan → implementation (TDD) → testing → review → merge → report
```

Each stage: Worker Agent produces artifact → Review Agent inspects quality → human approves → engine advances.

## CLI Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize `.agent-teams/` in workspace |
| `start <requirement>` | Start a new pipeline |
| `status` | Show pipeline progress |
| `next` | Advance to next stage |
| `approve <stage>` | Approve stage after human review |
| `reject <stage>` | Reject stage and retry |
| `retry <stage>` | Retry a failed stage |
| `artifact <stage>` | View stage artifact |
| `report` | Show pipeline summary |
| `list <resource>` | List agents / skills / standards |

## How It Works

- **TS Engine** manages pipeline state machine, git operations, and artifact validation deterministically
- **AI Agents** handle content production (Worker) and quality review (Reviewer)
- **Human-in-the-loop** at every stage gate
- **Git-based versioning** — all artifacts and configs follow your project's git history
- **TDD** built into the implementation stage (RED → GREEN → REFACTOR)

## Customization

After `agent-teams init`, edit `.agent-teams/`:

```
.agent-teams/
├── pipeline.yaml   # Stage definitions, agent bindings, review rules
├── agents/         # Role definitions (who does what)
├── skills/         # Method definitions (how to do it)
├── standards/      # Quality standards (coding rules, review checklists)
├── artifacts/      # Stage outputs (PRD, architecture, test results, etc.)
└── report.md       # Final project report
```

## Requirements

- Node.js >= 18
- Git

## License

ISC
