import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { initPipeline, getCurrentDispatch } from '../engine/pipeline.js';
import { loadPipelineConfig, getStageConfig } from '../engine/config.js';

export function startCommand(requirement: string, options: { spec?: string; clean?: boolean }): void {
  const pipelinePath = resolve('.agent-teams/pipeline.yaml');
  if (!existsSync(pipelinePath)) {
    console.error('No .agent-teams/pipeline.yaml found. Run "agent-teams init" first.');
    process.exit(1);
  }

  if (options.clean && existsSync('.agent-teams/state.json')) {
    rmSync('.agent-teams/state.json');
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

  const dispatch = getCurrentDispatch(config, state, requirement);
  if (dispatch) {
    console.log('--- Dispatch Instructions ---');
    console.log(dispatch.formatted);
    console.log('Run "agent-teams next" after the agent completes.');
  }
}
