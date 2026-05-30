import type { PipelineConfig, PipelineState, StageConfig, StageState, StageStatus } from '../types.js';
import { loadPipelineConfig, getStageConfig, getNextStage, validateDependencies } from './config.js';
import { loadState, saveState, createInitialState, getStageState, stageExists } from './state.js';
import type { DispatchInstruction } from '../types.js';
import { generateWorkerDispatch, generateReviewDispatch, formatDispatchForAI } from './dispatch.js';
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
  if (stageState.status === 'review') {
    if (!stageConfig.reviewer) {
      return null;
    }
    instruction = generateReviewDispatch(stageConfig, state);
  } else {
    if (stageConfig.engine) {
      return null;
    }
    instruction = generateWorkerDispatch(stageConfig, state, requirement);
  }

  return { instruction, formatted: formatDispatchForAI(instruction) };
}
