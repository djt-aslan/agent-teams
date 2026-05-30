import { existsSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { initPipeline, getCurrentDispatch } from '../engine/pipeline.js';
import { loadPipelineConfig, getStageConfig } from '../engine/config.js';
import { join } from 'node:path';

export function startCommand(requirement: string, options: { spec?: string; clean?: boolean }): void {
  const pipelinePath = '.agent-teams/pipeline.yaml';
  if (!existsSync(pipelinePath)) {
    console.error('No .agent-teams/pipeline.yaml found. Run "agent-teams init" first.');
    process.exit(1);
  }

  const artifactsDir = '.agent-teams/artifacts';
  if (!options.clean && existsSync(artifactsDir)) {
    const files = readdirSync(artifactsDir);
    if (files.length > 0) {
      console.log('Existing artifacts found. Use --clean to start fresh, or "agent-teams status" to resume.');
      return;
    }
  }

  if (options.clean) {
    if (existsSync('.agent-teams/state.json')) {
      rmSync('.agent-teams/state.json');
    }
    const dirs = ['artifacts', 'worktrees'];
    for (const dir of dirs) {
      const full = join('.agent-teams', dir);
      if (existsSync(full)) {
        for (const entry of readdirSync(full)) {
          rmSync(join(full, entry), { recursive: true, force: true });
        }
      }
    }
    console.log('Cleaned previous state and artifacts.');
  }

  const state = initPipeline(pipelinePath);

  let finalRequirement = requirement;
  if (options.spec) {
    if (!existsSync(options.spec)) {
      console.error(`Spec file not found: ${options.spec}`);
      process.exit(1);
    }
    finalRequirement = readFileSync(options.spec, 'utf-8');
    console.log(`Loaded spec from: ${options.spec}`);
  }
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

  const dispatch = getCurrentDispatch(config, state, finalRequirement);
  if (dispatch) {
    console.log('--- Dispatch Instructions ---');
    console.log(dispatch.formatted);
    console.log('Run "agent-teams next" after the agent completes.');
  }
}
