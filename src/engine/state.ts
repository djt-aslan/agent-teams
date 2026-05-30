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
