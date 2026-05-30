# Agent Teams V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript CLI tool that installs into OpenCode as a plugin, enabling end-to-end software delivery through a multi-agent pipeline with manual human-in-the-loop gates.

**Architecture:** TS engine manages pipeline state machine, configuration, and git operations deterministically. AI sub-agents handle content production (Worker) and quality review (Reviewer). CLI wraps the engine and exposes commands. OpenCode integration via `.opencode/commands/`.

**Tech Stack:** TypeScript, Node.js, Commander.js (CLI), YAML (config), JSON (state), Markdown (agents/skills/standards)

---

## File Structure

```
src/
├── index.ts                  # CLI entry point (commander setup)
├── types.ts                  # All TypeScript interfaces
├── commands/                 # CLI command handlers
│   ├── init.ts               # agent-teams init
│   ├── start.ts              # agent-teams start
│   ├── status.ts             # agent-teams status
│   ├── next.ts               # agent-teams next
│   ├── approve.ts            # agent-teams approve / reject / retry
│   ├── artifact.ts           # agent-teams artifact
│   ├── report.ts             # agent-teams report
│   └── list.ts               # agent-teams list
└── engine/                   # Deterministic TS engine
    ├── pipeline.ts           # State machine: advance, retry, complete
    ├── config.ts             # Parse pipeline.yaml
    ├── state.ts              # Read/write state.json
    ├── dispatch.ts           # Generate dispatch instructions for AI
    ├── artifact.ts           # Validate frontmatter, check files
    ├── git.ts                # Worktree create/merge/cleanup, git ops
    └── fixer.ts              # AI Fixer dispatch for error recovery

.opencode/commands/           # OpenCode integration
├── agent-teams.md            # Main command: dispatches based on stage
├── agent-teams-approve.md
├── agent-teams-reject.md
├── agent-teams-status.md
├── agent-teams-next.md
├── agent-teams-retry.md
├── agent-teams-artifact.md
├── agent-teams-report.md
├── agent-teams-list.md
└── agent-teams-init.md
```

**Design principle:** Each file has one clear responsibility. Commands handle CLI I/O. Engine handles logic. OpenCode commands are thin wrappers that invoke CLI.

---

### Task 1: Project Scaffolding and Types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/types.ts`
- Create: `src/index.ts` (skeleton)

- [ ] **Step 1: Initialize npm project**

```bash
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install commander yaml
npm install -D typescript @types/node tsx
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write src/types.ts with all interfaces**

```typescript
export type StageStatus = 'pending' | 'in_progress' | 'review' | 'human_review' | 'passed' | 'failed';

export type ReviewVerdict = 'pass' | 'fail' | 'pass_with_notes';

export interface StageConfig {
  stage: string;
  description: string;
  agent?: string;
  skill?: string;
  engine?: boolean;
  mode?: 'tdd';
  parallel?: boolean;
  worktrees?: string;
  reviewer?: {
    agent: string;
    skill: string;
  };
  depends_on?: string[];
  max_retries?: number;
  output: string;
  review?: boolean;
  gate?: string;
  action?: string;
}

export interface PipelineConfig {
  version: string;
  pipeline: StageConfig[];
}

export interface StageState {
  status: StageStatus;
  started_at?: string;
  completed_at?: string;
  attempt: number;
  review_verdict?: ReviewVerdict;
  batches?: BatchState[];
}

export interface BatchState {
  batch_id: string;
  tasks: string[];
  status: StageStatus;
  worktree?: string;
  output_path?: string;
}

export interface PipelineState {
  pipeline: string;
  current_stage: string;
  stages: Record<string, StageState>;
  started_at: string;
  artifacts: Record<string, string>;
}

export interface DispatchInstruction {
  task: string;
  agent: string;
  skill: string;
  output: string;
  context: {
    requirement?: string;
    artifacts: string[];
    stage: string;
  };
  target?: {
    stage: string;
    artifact: string;
  };
}

export interface ArtifactFrontmatter {
  stage: string;
  batch?: string;
  status: string;
  summary?: string;
  verdict?: ReviewVerdict;
  issues?: string[];
  notes?: string[];
  tasks?: string[];
  tests_passed?: number;
  tests_total?: number;
  diff_summary?: string;
  review_verdict?: ReviewVerdict;
}
```

- [ ] **Step 5: Write src/index.ts skeleton**

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('agent-teams')
  .description('AI Agent Teams for end-to-end software delivery')
  .version('0.1.0');

program.parse(process.argv);
```

- [ ] **Step 6: Add scripts to package.json**

Edit `package.json` to include:
```json
{
  "bin": {
    "agent-teams": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  }
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: compiles without errors, creates dist/index.js.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json src/types.ts src/index.ts
git commit -m "feat: add project scaffolding and type definitions"
```

---

### Task 2: Config Parser (engine/config.ts)

**Files:**
- Create: `src/engine/config.ts`
- Test: `src/engine/config.test.ts` (we'll test manually by running, no test framework yet)

- [ ] **Step 1: Write config parser**

```typescript
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { PipelineConfig, StageConfig } from '../types.js';

export function loadPipelineConfig(pipelinePath: string): PipelineConfig {
  const content = readFileSync(pipelinePath, 'utf-8');
  const config = parseYaml(content) as PipelineConfig;
  validateConfig(config);
  return config;
}

export function getStageConfig(config: PipelineConfig, stageName: string): StageConfig {
  const stage = config.pipeline.find(s => s.stage === stageName);
  if (!stage) {
    throw new Error(`Stage "${stageName}" not found in pipeline config`);
  }
  return stage;
}

export function getNextStage(config: PipelineConfig, currentStage: string): StageConfig | null {
  const idx = config.pipeline.findIndex(s => s.stage === currentStage);
  if (idx === -1 || idx >= config.pipeline.length - 1) return null;
  return config.pipeline[idx + 1];
}

export function getDependencies(config: PipelineConfig, stageName: string): string[] {
  const stage = getStageConfig(config, stageName);
  return stage.depends_on ?? [];
}

export function validateDependencies(config: PipelineConfig, stageName: string, completedStages: string[]): string[] {
  const deps = getDependencies(config, stageName);
  return deps.filter(d => !completedStages.includes(d));
}

function validateConfig(config: PipelineConfig): void {
  if (!config.version) throw new Error('Pipeline config missing version');
  if (!config.pipeline || !Array.isArray(config.pipeline)) {
    throw new Error('Pipeline config missing pipeline array');
  }
  for (const stage of config.pipeline) {
    if (!stage.stage) throw new Error('Stage missing name');
    if (!stage.output) throw new Error(`Stage "${stage.stage}" missing output path`);
  }
}
```

- [ ] **Step 2: Verify against defaults/pipeline.yaml**

```bash
npx tsx -e "
import { loadPipelineConfig } from './src/engine/config.js';
const config = loadPipelineConfig('defaults/pipeline.yaml');
console.log('Stages:', config.pipeline.map(s => s.stage));
console.log('Version:', config.version);
"
```

Expected output shows all 10 stage names.

- [ ] **Step 3: Commit**

```bash
git add src/engine/config.ts
git commit -m "feat: add pipeline config parser"
```

---

### Task 3: State Manager (engine/state.ts)

**Files:**
- Create: `src/engine/state.ts`

- [ ] **Step 1: Write state manager**

```typescript
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { PipelineState, StageState } from '../types.js';

export const STATE_FILE = '.agent-teams/state.json';

export function createInitialState(pipelinePath: string, stageNames: string[]): PipelineState {
  const stages: Record<string, StageState> = {};
  for (const name of stageNames) {
    stages[name] = { status: 'pending', attempt: 0 };
  }
  return {
    pipeline: pipelinePath,
    current_stage: stageNames[0],
    stages,
    started_at: new Date().toISOString(),
    artifacts: {},
  };
}

export function loadState(): PipelineState {
  if (!existsSync(STATE_FILE)) {
    throw new Error('No pipeline running. Run "agent-teams start" first.');
  }
  const content = readFileSync(STATE_FILE, 'utf-8');
  return JSON.parse(content) as PipelineState;
}

export function saveState(state: PipelineState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function stageExists(state: PipelineState, stageName: string): boolean {
  return stageName in state.stages;
}

export function getStageState(state: PipelineState, stageName: string): StageState {
  if (!stageExists(state, stageName)) {
    throw new Error(`Stage "${stageName}" not found`);
  }
  return state.stages[stageName];
}

export function isStageComplete(state: PipelineState, stageName: string): boolean {
  const s = getStageState(state, stageName);
  return s.status === 'passed';
}

export function getCompletedStages(state: PipelineState): string[] {
  return Object.entries(state.stages)
    .filter(([_, s]) => s.status === 'passed')
    .map(([name]) => name);
}
```

- [ ] **Step 2: Verify**

```bash
npx tsx -e "
import { createInitialState } from './src/engine/state.js';
const state = createInitialState('pipeline.yaml', ['requirement', 'prd', 'architecture']);
console.log(JSON.stringify(state, null, 2));
"
```

- [ ] **Step 3: Commit**

```bash
git add src/engine/state.ts
git commit -m "feat: add pipeline state manager"
```

---

### Task 4: Artifact Validator (engine/artifact.ts)

**Files:**
- Create: `src/engine/artifact.ts`

- [ ] **Step 1: Write artifact validator**

```typescript
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { ArtifactFrontmatter, ReviewVerdict } from '../types.js';

export function parseFrontmatter(filePath: string): ArtifactFrontmatter {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }
  return parseYaml(match[1]) as ArtifactFrontmatter;
}

export function validateArtifact(filePath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  try {
    const fm = parseFrontmatter(filePath);
    if (!fm.stage) errors.push('Missing "stage" field');
    if (!fm.status) errors.push('Missing "status" field');
  } catch (e) {
    errors.push(`Frontmatter parse error: ${(e as Error).message}`);
  }
  return { valid: errors.length === 0, errors };
}

export function getReviewVerdict(filePath: string): ReviewVerdict | null {
  const fm = parseFrontmatter(filePath);
  return fm.verdict ?? null;
}

export function getArtifactSummary(filePath: string): string {
  const fm = parseFrontmatter(filePath);
  return fm.summary ?? '(no summary)';
}

export function readArtifactContent(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/artifact.ts
git commit -m "feat: add artifact frontmatter validator"
```

---

### Task 5: Git Operations (engine/git.ts)

**Files:**
- Create: `src/engine/git.ts`

- [ ] **Step 1: Write git operations**

```typescript
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

function runGit(args: string): GitResult {
  try {
    const output = execSync(`git ${args}`, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output: output.trim() };
  } catch (e: any) {
    return { success: false, output: '', error: e.stderr?.trim() ?? e.message };
  }
}

export function isGitRepo(): boolean {
  return existsSync('.git');
}

export function getCurrentBranch(): string {
  return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
}

export function createWorktree(batchId: string, baseDir: string, sourceBranch?: string): GitResult {
  const worktreePath = join(baseDir, batchId);
  if (existsSync(worktreePath)) {
    rmSync(worktreePath, { recursive: true, force: true });
  }
  const branch = sourceBranch ?? getCurrentBranch();
  return runGit(`worktree add "${worktreePath}" "${branch}"`);
}

export function removeWorktree(batchId: string, baseDir: string): GitResult {
  const worktreePath = join(baseDir, batchId);
  const r = runGit(`worktree remove "${worktreePath}" --force`);
  if (existsSync(worktreePath)) {
    rmSync(worktreePath, { recursive: true, force: true });
  }
  return r;
}

export function cleanWorktrees(baseDir: string): void {
  if (existsSync(baseDir)) {
    rmSync(baseDir, { recursive: true, force: true });
  }
}

export function mergeWorktree(batchId: string, baseDir: string): GitResult {
  const worktreePath = join(baseDir, batchId);
  return runGit(`merge "${worktreePath}" --no-ff -m "merge: batch ${batchId}"`);
}

export function commitChanges(message: string): GitResult {
  return runGit(`commit -am "${message}"`);
}

export function pushChanges(): GitResult {
  return runGit('push');
}

export function hasConflicts(): boolean {
  const r = runGit('status --porcelain');
  return r.output.includes('UU ') || r.output.includes('AA ');
}

export function getWorktreeDiff(batchId: string, baseDir: string): string {
  const worktreePath = join(baseDir, batchId);
  try {
    return execSync(`git -C "${worktreePath}" diff HEAD`, { encoding: 'utf-8' });
  } catch {
    return '(unable to read diff)';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/git.ts
git commit -m "feat: add git worktree and merge operations"
```

---

### Task 6: Dispatch Instructions Generator (engine/dispatch.ts)

**Files:**
- Create: `src/engine/dispatch.ts`

- [ ] **Step 1: Write dispatch generator**

```typescript
import type { StageConfig, PipelineState, DispatchInstruction } from '../types.js';
import { getStageState } from './state.js';

export function generateWorkerDispatch(
  config: StageConfig,
  state: PipelineState,
  requirement?: string
): DispatchInstruction {
  const artifacts: string[] = [];
  if (config.depends_on) {
    for (const dep of config.depends_on) {
      const depStage = state.artifacts[dep];
      if (depStage) artifacts.push(depStage);
    }
  }

  return {
    task: config.stage,
    agent: config.agent!,
    skill: config.skill!,
    output: config.output,
    context: {
      requirement,
      artifacts,
      stage: config.stage,
    },
  };
}

export function generateReviewDispatch(
  config: StageConfig,
  state: PipelineState,
  batchId?: string
): DispatchInstruction {
  let artifactPath = config.output;
  if (batchId) {
    artifactPath = `artifacts/implementation/${batchId}-report.md`;
  }

  return {
    task: 'review',
    agent: config.reviewer!.agent,
    skill: config.reviewer!.skill,
    output: `artifacts/review-reports/${config.stage}${batchId ? '-' + batchId : ''}-review.md`,
    context: {
      artifacts: [artifactPath],
      stage: config.stage,
    },
    target: {
      stage: config.stage,
      artifact: artifactPath,
    },
  };
}

export function formatDispatchForAI(instruction: DispatchInstruction): string {
  const lines: string[] = [];
  lines.push(`## Dispatch: ${instruction.task.toUpperCase()}`);
  lines.push('');
  lines.push(`**Agent:** ${instruction.agent}`);
  lines.push(`**Skill:** ${instruction.skill}`);
  lines.push(`**Output:** ${instruction.output}`);
  lines.push('');
  if (instruction.context.artifacts.length > 0) {
    lines.push('**Context artifacts (read as needed):**');
    for (const a of instruction.context.artifacts) {
      lines.push(`- ${a}`);
    }
    lines.push('');
  }
  if (instruction.context.requirement) {
    lines.push(`**User requirement:** ${instruction.context.requirement}`);
    lines.push('');
  }
  if (instruction.target) {
    lines.push(`**Review target:** ${instruction.target.artifact}`);
    lines.push('');
  }
  lines.push('---');
  return lines.join('\n');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/dispatch.ts
git commit -m "feat: add dispatch instruction generator"
```

---

### Task 7: Pipeline Engine (engine/pipeline.ts)

**Files:**
- Create: `src/engine/pipeline.ts`

- [ ] **Step 1: Write pipeline state machine**

```typescript
import type { PipelineConfig, PipelineState, StageConfig, StageState, StageStatus } from '../types.js';
import { loadPipelineConfig, getStageConfig, getNextStage, validateDependencies } from './config.js';
import { loadState, saveState, createInitialState, getStageState, stageExists } from './state.js';
import type { DispatchInstruction } from './dispatch.js';
import { generateWorkerDispatch, generateReviewDispatch, formatDispatchForAI } from './dispatch.js';
import { parseFrontmatter } from './artifact.js';
import { existsSync } from 'node:fs';

export function initPipeline(pipelinePath: string): PipelineState {
  if (existsSync('.agent-teams/state.json')) {
    throw new Error('Pipeline already initialized. Use --clean to start fresh.');
  }
  const config = loadPipelineConfig(pipelinePath);
  const stageNames = config.pipeline.map(s => s.stage);
  const state = createInitialState(pipelinePath, stageNames);
  saveState(state);
  return state;
}

export function advanceStage(state: PipelineState, stageName: string, status: StageStatus): PipelineState {
  const stage = state.stages[stageName];
  stage.status = status;
  stage.completed_at = new Date().toISOString();
  saveState(state);
  return state;
}

export function startStage(state: PipelineState, stageName: string): PipelineState {
  const stage = state.stages[stageName];
  stage.status = 'in_progress';
  stage.started_at = new Date().toISOString();
  stage.attempt++;
  saveState(state);
  return state;
}

export function setReviewStage(state: PipelineState, stageName: string): PipelineState {
  const stage = state.stages[stageName];
  stage.status = 'review';
  saveState(state);
  return state;
}

export function setHumanReviewStage(state: PipelineState, stageName: string): PipelineState {
  const stage = state.stages[stageName];
  stage.status = 'human_review';
  saveState(state);
  return state;
}

export function markPassed(state: PipelineState, stageName: string): PipelineState {
  const stage = state.stages[stageName];
  stage.status = 'passed';
  stage.completed_at = new Date().toISOString();
  state.artifacts[stageName] = getStageConfig(loadPipelineConfig(state.pipeline), stageName).output;
  saveState(state);
  return state;
}

export function markFailed(state: PipelineState, stageName: string): PipelineState {
  const stage = state.stages[stageName];
  stage.status = 'failed';
  saveState(state);
  return state;
}

export function retryStage(state: PipelineState, stageName: string, config: PipelineConfig): PipelineState {
  const stage = state.stages[stageName];
  const stageConfig = getStageConfig(config, stageName);
  const maxRetries = stageConfig.max_retries ?? 3;
  if (stage.attempt >= maxRetries) {
    throw new Error(`Stage "${stageName}" exceeded max retries (${maxRetries})`);
  }
  stage.status = 'in_progress';
  saveState(state);
  return state;
}

export function getCurrentDispatch(config: PipelineConfig, state: PipelineState, requirement?: string): { instruction: DispatchInstruction; formatted: string } | null {
  const currentStage = state.current_stage;
  const stageConfig = getStageConfig(config, currentStage);
  const stageState = getStageState(state, currentStage);

  if (stageState.status === 'failed') return null;
  if (stageState.status === 'human_review') return null;
  if (stageState.status === 'passed') return null;

  let instruction: DispatchInstruction;
  if (stageState.status === 'review' || stageState.status === 'passed') {
    if (!stageConfig.reviewer) {
      // No reviewer for this stage (e.g., requirement), go to human review
      return null;
    }
    instruction = generateReviewDispatch(stageConfig, state);
  } else {
    if (stageConfig.engine) {
      return null; // Engine-executed stage (merge)
    }
    instruction = generateWorkerDispatch(stageConfig, state, requirement);
  }

  return { instruction, formatted: formatDispatchForAI(instruction) };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/pipeline.ts
git commit -m "feat: add pipeline state machine engine"
```

---

### Task 8: AI Fixer (engine/fixer.ts)

**Files:**
- Create: `src/engine/fixer.ts`

- [ ] **Step 1: Write AI fixer module**

```typescript
import type { DispatchInstruction } from './dispatch.js';
import { formatDispatchForAI } from './dispatch.js';

export interface FixerConfig {
  agent: string;
  skill: string;
}

const DEFAULT_FIXER: FixerConfig = {
  agent: 'agents/reviewer.md',
  skill: 'skills/code-review.md',
};

export function generateFixerDispatch(
  error: Error,
  context: string,
  fixerConfig: FixerConfig = DEFAULT_FIXER
): DispatchInstruction {
  return {
    task: 'fix',
    agent: fixerConfig.agent,
    skill: fixerConfig.skill,
    output: '(no output - fix only)',
    context: {
      artifacts: [],
      stage: 'error-recovery',
      requirement: `The following operation failed: ${context}\n\nError:\n\`\`\`\n${error.message}\n\`\`\`\n\nPlease diagnose and fix this issue. Then instruct the user to resume by running "agent-teams next".`,
    },
  };
}

export function formatFixerForAI(instruction: DispatchInstruction): string {
  return `## EROR RECOVERY\n\n${formatDispatchForAI(instruction)}\n\nAfter fixing, tell the user to run "agent-teams next" to continue.`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/fixer.ts
git commit -m "feat: add AI fixer error recovery module"
```

---

### Task 9: Init Command (commands/init.ts)

**Files:**
- Create: `src/commands/init.ts`
- Modify: `src/index.ts` (register command)

- [ ] **Step 1: Write init command**

```typescript
import { existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function initCommand(): void {
  const targetPath = join(process.cwd(), '.agent-teams');
  const defaultsPath = findDefaultsPath();

  if (existsSync(targetPath)) {
    console.log('.agent-teams/ already exists. Use --clean to overwrite.');
    return;
  }

  mkdirSync(targetPath, { recursive: true });
  copyDir(defaultsPath, targetPath);

  // Create empty artifacts directory
  mkdirSync(join(targetPath, 'artifacts'), { recursive: true });
  mkdirSync(join(targetPath, 'artifacts', 'implementation'), { recursive: true });
  mkdirSync(join(targetPath, 'artifacts', 'review-reports'), { recursive: true });
  mkdirSync(join(targetPath, 'worktrees'), { recursive: true });

  console.log(`
Agent Teams initialized!

Created: .agent-teams/
  ├── pipeline.yaml
  ├── agents/        (${countFiles(join(targetPath, 'agents'))} agents)
  ├── skills/        (${countFiles(join(targetPath, 'skills'))} skills)
  ├── standards/     (${countFilesRecursive(join(targetPath, 'standards'))} standards)
  ├── artifacts/
  └── worktrees/

Next: agent-teams start "your requirement description"
`);
}

function findDefaultsPath(): string {
  // Check multiple possible locations for the defaults directory
  const candidates = [
    join(__dirname, '..', '..', 'defaults'),
    join(__dirname, '..', 'defaults'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('Cannot find defaults directory');
}

function copyDir(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

function countFiles(dir: string): number {
  return readdirSync(dir).filter(f => statSync(join(dir, f)).isFile()).length;
}

function countFilesRecursive(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      count += countFilesRecursive(full);
    } else {
      count++;
    }
  }
  return count;
}
```

- [ ] **Step 2: Register in src/index.ts**

```typescript
import { initCommand } from './commands/init.js';

program
  .command('init')
  .description('Initialize Agent Teams in the current workspace')
  .option('--clean', 'Overwrite existing .agent-teams/')
  .action((options) => {
    if (options.clean && existsSync('.agent-teams')) {
      rmSync('.agent-teams', { recursive: true, force: true });
    }
    initCommand();
  });
```

Add needed imports at top:
```typescript
import { existsSync, rmSync } from 'node:fs';
```

- [ ] **Step 3: Verify**

```bash
npm run build
npx tsx src/index.ts init
```

Expected: creates `.agent-teams/` with all files copied.

- [ ] **Step 4: Commit**

```bash
git add src/commands/init.ts src/index.ts
git commit -m "feat: add init command"
```

---

### Task 10: Start Command (commands/start.ts)

**Files:**
- Create: `src/commands/start.ts`
- Modify: `src/index.ts` (register command)

- [ ] **Step 1: Write start command**

```typescript
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initPipeline } from '../engine/pipeline.js';
import { loadPipelineConfig, getStageConfig } from '../engine/config.js';
import { getCurrentDispatch } from '../engine/pipeline.js';

export function startCommand(requirement: string, options: { spec?: string; clean?: boolean }): void {
  const pipelinePath = resolve('.agent-teams/pipeline.yaml');
  if (!existsSync(pipelinePath)) {
    console.error('No .agent-teams/pipeline.yaml found. Run "agent-teams init" first.');
    process.exit(1);
  }

  if (options.clean && existsSync('.agent-teams/state.json')) {
    require('node:fs').rmSync('.agent-teams/state.json');
    console.log('Cleaned previous state.');
  }

  const state = initPipeline(pipelinePath);
  const config = loadPipelineConfig(pipelinePath);
  const currentStage = getStageConfig(config, state.current_stage);

  console.log(`
========================================
Agent Teams Pipeline Started
========================================
Pipeline: ${pipelinePath}
Starting: ${currentStage.stage} - ${currentStage.description}

Use "agent-teams next" to dispatch the first task.
Use "agent-teams status" to check progress.
`);

  // Show first dispatch instructions
  const dispatch = getCurrentDispatch(config, state, requirement);
  if (dispatch) {
    console.log('--- Dispatch Instructions ---');
    console.log(dispatch.formatted);
    console.log('Run "agent-teams next" after the agent completes.');
  }
}
```

- [ ] **Step 2: Register in src/index.ts**

```typescript
import { startCommand } from './commands/start.js';

program
  .command('start [requirement]')
  .description('Start a new pipeline')
  .option('--spec <path>', 'Path to requirements spec file')
  .option('--clean', 'Clear previous state')
  .action((requirement, options) => {
    startCommand(requirement ?? '', options);
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/start.ts src/index.ts
git commit -m "feat: add start command"
```

---

### Task 11: Status Command (commands/status.ts)

**Files:**
- Create: `src/commands/status.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write status command**

```typescript
import { loadState } from '../engine/state.js';
import { loadPipelineConfig, getStageConfig } from '../engine/config.js';

export function statusCommand(): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);

  console.log('\nPipeline Status');
  console.log('='.repeat(60));
  console.log(`Started: ${state.started_at}`);

  for (const stageConfig of config.pipeline) {
    const stageState = state.stages[stageConfig.stage];
    const icon = statusIcon(stageState.status);
    const retries = stageState.attempt > 1 ? ` (attempt ${stageState.attempt})` : '';
    const isCurrent = stageConfig.stage === state.current_stage ? ' ← current' : '';

    console.log(`  ${icon} ${stageConfig.stage.padEnd(18)} ${stageState.status.padEnd(14)} ${retries}${isCurrent}`);

    if (stageConfig.stage === state.current_stage && stageState.status === 'human_review') {
      console.log('      ⚠  Awaiting human review. Use "agent-teams approve" or "agent-teams reject".');
    }
  }
  console.log('='.repeat(60));
}

function statusIcon(status: string): string {
  switch (status) {
    case 'passed': return '✓';
    case 'in_progress': return '▶';
    case 'review': return '○';
    case 'human_review': return '⏸';
    case 'failed': return '✗';
    default: return ' ';
  }
}
```

- [ ] **Step 2: Register command**

```typescript
import { statusCommand } from './commands/status.js';

program
  .command('status')
  .description('Show pipeline status')
  .action(() => statusCommand());
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/status.ts src/index.ts
git commit -m "feat: add status command"
```

---

### Task 12: Next Command (commands/next.ts)

**Files:**
- Create: `src/commands/next.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write next command**

```typescript
import { loadState, saveState } from '../engine/state.js';
import { loadPipelineConfig, getStageConfig, getNextStage } from '../engine/config.js';
import { startStage, setReviewStage, setHumanReviewStage, getCurrentDispatch } from '../engine/pipeline.js';
import { existsSync } from 'node:fs';
import { validateArtifact, getReviewVerdict } from '../engine/artifact.js';

export function nextCommand(requirement?: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  const currentStage = getStageConfig(config, state.current_stage);
  const stageState = state.stages[state.current_stage];

  // Determine what to do based on current status
  if (stageState.status === 'pending') {
    // Start the worker for this stage
    startStage(state, state.current_stage);
    console.log(`Starting stage: ${currentStage.stage}`);

    if (currentStage.engine) {
      handleEngineStage(currentStage, state, config);
      return;
    }

    const dispatch = getCurrentDispatch(config, state, requirement);
    if (dispatch) {
      console.log(dispatch.formatted);
    }
  } else if (stageState.status === 'in_progress') {
    // Worker finished, check output
    const artifactPath = currentStage.output;
    if (!existsSync(artifactPath)) {
      console.error(`Artifact not found: ${artifactPath}`);
      console.log('The agent should produce the artifact specified in the dispatch instructions.');
      return;
    }

    const validation = validateArtifact(artifactPath);
    if (!validation.valid) {
      console.error('Artifact validation failed:');
      for (const err of validation.errors) {
        console.error(`  - ${err}`);
      }
      return;
    }

    if (currentStage.review === false || !currentStage.reviewer) {
      // No review needed, go directly to human review
      setHumanReviewStage(state, state.current_stage);
      console.log(`Stage "${state.current_stage}" completed. Ready for human review.`);
      console.log('Use "agent-teams approve <stage>" or "agent-teams reject <stage>".');
    } else {
      // Need AI review first
      setReviewStage(state, state.current_stage);
      console.log(`Stage "${state.current_stage}" completed. Dispatching review...`);
      const dispatch = getCurrentDispatch(config, state, requirement);
      if (dispatch) {
        console.log(dispatch.formatted);
      }
    }
  } else if (stageState.status === 'review') {
    // Review completed, check verdict
    const reviewOutput = `artifacts/review-reports/${state.current_stage}-review.md`;
    if (!existsSync(reviewOutput)) {
      console.error(`Review report not found: ${reviewOutput}`);
      return;
    }

    const verdict = getReviewVerdict(reviewOutput);
    stageState.review_verdict = verdict ?? undefined;
    setHumanReviewStage(state, state.current_stage);

    console.log(`Review complete for "${state.current_stage}"`);
    console.log(`Verdict: ${verdict ?? '(unknown)'}`);
    console.log('\nReady for human review.');
    console.log('  approve: agent-teams approve ' + state.current_stage);
    console.log('  reject:  agent-teams reject ' + state.current_stage);
  } else if (stageState.status === 'passed') {
    // Move to next stage
    const next = getNextStage(config, state.current_stage);
    if (!next) {
      console.log('All stages complete!');
      return;
    }
    state.current_stage = next.stage;
    saveState(state);
    console.log(`Advanced to: ${next.stage} - ${next.description}`);
    const dispatch = getCurrentDispatch(config, state, requirement);
    if (next.engine) {
      console.log(`Stage "${next.stage}" will be executed by the engine. Run "agent-teams next" to proceed.`);
    } else if (dispatch) {
      console.log(dispatch.formatted);
    }
  } else if (stageState.status === 'human_review') {
    console.log('Waiting for human review.');
    console.log('  approve: agent-teams approve ' + state.current_stage);
    console.log('  reject:  agent-teams reject ' + state.current_stage);
  }
}

function handleEngineStage(stageConfig: any, state: any, config: any): void {
  if (stageConfig.action === 'merge') {
    console.log('Engine executing merge...');
    // Merge logic will be implemented in Task 14
    console.log('Merge placeholder - to be implemented.');
  }
}
```

- [ ] **Step 2: Register**

```typescript
import { nextCommand } from './commands/next.js';

program
  .command('next')
  .description('Advance to the next stage')
  .action(() => nextCommand());
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/next.ts src/index.ts
git commit -m "feat: add next command"
```

---

### Task 13: Approve/Reject/Retry Commands (commands/approve.ts)

**Files:**
- Create: `src/commands/approve.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write approve/reject/retry commands**

```typescript
import { loadState, saveState } from '../engine/state.js';
import { loadPipelineConfig, getStageConfig, getNextStage } from '../engine/config.js';
import { markPassed, markFailed, retryStage, advanceStage } from '../engine/pipeline.js';

export function approveCommand(stageName: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  const stageConfig = getStageConfig(config, stageName);
  const stageState = state.stages[stageName];

  if (stageState.status !== 'human_review') {
    console.error(`Stage "${stageName}" is not in human review (current: ${stageState.status})`);
    return;
  }

  markPassed(state, stageName);

  // Advance to next stage
  const next = getNextStage(config, stageName);
  if (next) {
    state.current_stage = next.stage;
    saveState(state);
    console.log(`Stage "${stageName}" approved. Advanced to "${next.stage}".`);
  } else {
    state.current_stage = stageName;
    saveState(state);
    console.log(`Stage "${stageName}" approved. Pipeline complete!`);
  }
}

export function rejectCommand(stageName: string, reason?: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  const stageState = state.stages[stageName];

  if (stageState.status !== 'human_review') {
    console.error(`Stage "${stageName}" is not in human review (current: ${stageState.status})`);
    return;
  }

  retryStage(state, stageName, config);
  console.log(`Stage "${stageName}" rejected${reason ? ': ' + reason : ''}. Stage will be retried.`);
  console.log('Run "agent-teams next" to re-dispatch the worker.');
}

export function retryCommand(stageName: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);

  try {
    retryStage(state, stageName, config);
    console.log(`Stage "${stageName}" marked for retry. Run "agent-teams next" to dispatch.`);
  } catch (e) {
    console.error((e as Error).message);
  }
}
```

- [ ] **Step 2: Register commands**

```typescript
import { approveCommand, rejectCommand, retryCommand } from './commands/approve.js';

program
  .command('approve <stage>')
  .description('Approve a stage after human review')
  .action((stage) => approveCommand(stage));

program
  .command('reject <stage>')
  .description('Reject a stage and retry')
  .option('--reason <reason>', 'Reason for rejection')
  .action((stage, options) => rejectCommand(stage, options.reason));

program
  .command('retry <stage>')
  .description('Retry a failed stage')
  .action((stage) => retryCommand(stage));
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/approve.ts src/index.ts
git commit -m "feat: add approve/reject/retry commands"
```

---

### Task 14: Merge Stage Implementation (engine/git.ts additions)

**Files:**
- Modify: `src/engine/git.ts`
- Modify: `src/commands/next.ts`

- [ ] **Step 1: Add merge pipeline logic to git.ts**

Add to end of `src/engine/git.ts`:

```typescript
export function executeMerge(
  worktreesDir: string,
  batchIds: string[],
  commitMessage: string
): GitResult {
  // Merge worktrees in order
  for (const batchId of batchIds) {
    const result = mergeWorktree(batchId, worktreesDir);
    if (!result.success) {
      if (hasConflicts()) {
        return {
          success: false,
          output: '',
          error: `Merge conflict in batch "${batchId}".\n${result.error}\n\nManual intervention required.`,
        };
      }
      return result;
    }
  }

  // Commit merge
  const commitR = commitChanges(commitMessage);
  if (!commitR.success) {
    // May have nothing to commit if already clean
    if (!commitR.error?.includes('nothing to commit')) {
      return commitR;
    }
  }

  // Push
  return pushChanges();
}
```

- [ ] **Step 2: Update handleEngineStage in next.ts**

Replace the placeholder in `commands/next.ts`:

```typescript
import { executeMerge } from '../engine/git.js';

function handleEngineStage(stageConfig: any, state: any, config: any): void {
  if (stageConfig.action === 'merge') {
    const batchIds = Object.keys(state.stages.implementation?.batches ?? {});
    const worktreesDir = '.agent-teams/worktrees';
    
    console.log(`Engine: Merging ${batchIds.length} batches...`);
    const result = executeMerge(worktreesDir, batchIds, 'chore: merge agent-teams implementation batches');
    
    if (result.success) {
      advanceStage(state, state.current_stage, 'passed');
      console.log('Merge successful.');
    } else {
      console.error(`Merge failed: ${result.error}`);
      console.log('Use "agent-teams fixer" or resolve conflicts manually.');
    }
    return;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/engine/git.ts src/commands/next.ts
git commit -m "feat: implement merge stage in engine"
```

---

### Task 15: Artifact and Report Commands (commands/artifact.ts, commands/report.ts)

**Files:**
- Create: `src/commands/artifact.ts`
- Create: `src/commands/report.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write artifact command**

```typescript
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadState } from '../engine/state.js';
import { parseFrontmatter } from '../engine/artifact.js';

export function artifactCommand(stageName: string): void {
  const state = loadState();
  const artifactPath = state.artifacts[stageName];

  if (!artifactPath || !existsSync(artifactPath)) {
    console.error(`No artifact found for stage "${stageName}"`);
    return;
  }

  const fm = parseFrontmatter(artifactPath);
  const content = readFileSync(artifactPath, 'utf-8');

  console.log(`\n=== ${stageName.toUpperCase()} ===`);
  console.log(`Status: ${fm.status}`);
  if (fm.summary) console.log(`Summary: ${fm.summary}`);
  if (fm.verdict) console.log(`Review: ${fm.verdict}`);
  if (fm.issues && fm.issues.length > 0) {
    console.log('Issues:');
    for (const issue of fm.issues) console.log(`  - ${issue}`);
  }
  console.log('\n--- Content ---\n');
  console.log(content);
}
```

- [ ] **Step 2: Write report command**

```typescript
import { loadState } from '../engine/state.js';
import { loadPipelineConfig } from '../engine/config.js';
import { statusCommand } from './status.js';

export function reportCommand(): void {
  statusCommand();
  
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  
  console.log('\n--- Artifact Summary ---');
  for (const [stageName, artifactPath] of Object.entries(state.artifacts)) {
    const stageConfig = config.pipeline.find(s => s.stage === stageName);
    console.log(`  ${stageName}: ${artifactPath} (${stageConfig?.description ?? ''})`);
  }

  const allPassed = config.pipeline.every(s => state.stages[s.stage].status === 'passed');
  if (allPassed) {
    console.log('\nAll stages passed. Pipeline complete!');
    console.log('Generate final report by dispatching the reporter agent.');
  }
}
```

- [ ] **Step 3: Register**

```typescript
import { artifactCommand } from './commands/artifact.js';
import { reportCommand } from './commands/report.js';

program
  .command('artifact <stage>')
  .description('Show artifact for a stage')
  .action((stage) => artifactCommand(stage));

program
  .command('report')
  .description('Show pipeline summary')
  .action(() => reportCommand());
```

- [ ] **Step 4: Commit**

```bash
git add src/commands/artifact.ts src/commands/report.ts src/index.ts
git commit -m "feat: add artifact and report commands"
```

---

### Task 16: List Command (commands/list.ts)

**Files:**
- Create: `src/commands/list.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write list command**

```typescript
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function listCommand(resource: string): void {
  const basePath = join('.agent-teams');
  const resourcePath = join(basePath, resource);

  if (!existsSync(resourcePath)) {
    console.error(`No "${resource}" directory found in .agent-teams/`);
    return;
  }

  console.log(`\n${resource.toUpperCase()}:`);
  console.log('='.repeat(40));

  if (resource === 'standards') {
    // Recursive listing for standards
    listRecursive(resourcePath, '');
  } else {
    for (const file of readdirSync(resourcePath)) {
      if (file.endsWith('.md') || file.endsWith('.yaml')) {
        console.log(`  ${file.replace('.md', '').replace('.yaml', '')}`);
      }
    }
  }
  console.log('');
}

function listRecursive(dir: string, prefix: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      console.log(`  ${prefix}${entry}/`);
      listRecursive(full, prefix + '  ');
    } else if (entry.endsWith('.md')) {
      console.log(`  ${prefix}${entry.replace('.md', '')}`);
    }
  }
}
```

- [ ] **Step 2: Register**

```typescript
import { listCommand } from './commands/list.js';

program
  .command('list <resource>')
  .description('List agents, skills, or standards')
  .action((resource) => {
    if (!['agents', 'skills', 'standards'].includes(resource)) {
      console.error('Resource must be: agents, skills, or standards');
      return;
    }
    listCommand(resource);
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/list.ts src/index.ts
git commit -m "feat: add list command"
```

---

### Task 17: End-to-End Integration Test

**Files:**
- No new files. Verify everything works together.

- [ ] **Step 1: Build and verify CLI**

```bash
npm run build
node dist/index.js --help
```

Expected: shows all registered commands.

- [ ] **Step 2: Test init in a temp project**

```bash
mkdir test-project
cd test-project
git init
node ../dist/index.js init
```

Expected: creates `.agent-teams/` with all files from defaults.

Verify: `ls .agent-teams/` shows pipeline.yaml, agents/, skills/, standards/, artifacts/, worktrees/

- [ ] **Step 3: Test start and status flow**

```bash
node ../dist/index.js start "test requirement"
node ../dist/index.js status
```

Expected: shows pipeline with requirement stage as current.

- [ ] **Step 4: Test state machine (next, approve)**

Simulate through the pipeline manually:
```bash
# Mark requirement as in_progress then completed
node ../dist/index.js next
# Simulate artifact creation
echo -e "---\nstage: requirement\nstatus: completed\n---\n# Test" > .agent-teams/artifacts/requirement.md
node ../dist/index.js next
# Should show awaiting human review
node ../dist/index.js status
node ../dist/index.js approve requirement
node ../dist/index.js status
# Should show prd as current
```

- [ ] **Step 5: Clean up test project**

```bash
cd ..
rm -rf test-project
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete CLI with all commands"
```

---

### Task 18: OpenCode Integration (.opencode/commands/)

**Files:**
- Create: `.opencode/commands/agent-teams.md`
- Create: `.opencode/commands/agent-teams-next.md`
- Create: `.opencode/commands/agent-teams-status.md`
- Create: `.opencode/commands/agent-teams-approve.md`
- Create: `.opencode/commands/agent-teams-reject.md`

- [ ] **Step 1: Write main agent-teams command**

```markdown
---
description: Agent Teams - multi-agent end-to-end software delivery pipeline
---

# Agent Teams Pipeline

/invoke agent-teams-next
```

- [ ] **Step 2: Write agent-teams-next command**

```markdown
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
```

- [ ] **Step 3: Write agent-teams-status command**

```markdown
---
description: Show Agent Teams pipeline status
---

Run `agent-teams status` and display the output.
```

- [ ] **Step 4: Write agent-teams-approve command**

```markdown
---
description: Approve a pipeline stage after human review
---

Run `agent-teams approve <stage>` where `<stage>` is the current stage name from the pipeline status.
```

- [ ] **Step 5: Write agent-teams-reject command**

```markdown
---
description: Reject a pipeline stage and retry
---

Run `agent-teams reject <stage> --reason "<your reason>"`.
```

- [ ] **Step 6: Commit**

```bash
git add .opencode/
git commit -m "feat: add OpenCode command integrations"
```

---

### Task 19: Full Pipeline Dry-Run Demo Script

**Files:**
- Create: `demo/run-demo.sh` (bash script for demo)

- [ ] **Step 1: Write demo script**

```bash
#!/bin/bash
set -e

echo "=== Agent Teams Demo ==="

# Init
echo "[1] Initializing..."
rm -rf demo-project
mkdir demo-project
cd demo-project
git init
agent-teams init

# Start
echo "[2] Starting pipeline..."
agent-teams start "Build a simple TODO API"
agent-teams status

echo ""
echo "=== Demo setup complete ==="
echo "Open OpenCode in demo-project/ and run:"
echo "  /agent-teams-next"
```

- [ ] **Step 2: Commit**

```bash
git add demo/
git commit -m "docs: add demo script"
```

---

### Task 20: Final Polish

- [ ] **Step 1: Ensure package.json has correct fields**

Verify `package.json`:
```json
{
  "name": "agent-teams",
  "version": "0.1.0",
  "description": "AI Agent Teams for end-to-end software delivery",
  "main": "dist/index.js",
  "bin": {
    "agent-teams": "dist/index.js"
  },
  "files": [
    "dist/",
    "defaults/",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "prepublishOnly": "npm run build"
  }
}
```

- [ ] **Step 2: Add .gitignore**

```
node_modules/
dist/
*.js.map
.env
demo-project/
```

- [ ] **Step 3: Final build and verify**

```bash
npm run build
npx tsx src/index.ts --help
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: finalize package configuration"
```
