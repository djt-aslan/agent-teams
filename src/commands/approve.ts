import { existsSync, rmSync } from 'node:fs';
import { loadState, saveState } from '../engine/state.js';
import { loadPipelineConfig, getStageConfig, getNextStage } from '../engine/config.js';
import { markPassed, retryStage } from '../engine/pipeline.js';

function cleanStageArtifacts(stageName: string): void {
  const artifactPath = `.agent-teams/artifacts/${stageName}.md`;
  if (existsSync(artifactPath)) rmSync(artifactPath);
  const reviewPath = `.agent-teams/artifacts/review-reports/${stageName}-review.md`;
  if (existsSync(reviewPath)) rmSync(reviewPath);
}

export function approveCommand(stageName: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  const stageState = state.stages[stageName];

  if (stageState.status !== 'human_review') {
    console.error(`Stage "${stageName}" is not in human review (current: ${stageState.status})`);
    return;
  }

  markPassed(state, stageName);

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
  cleanStageArtifacts(stageName);
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
