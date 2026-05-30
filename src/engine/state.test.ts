import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInitialState, saveState, loadState, getStageState, isStageComplete, getCompletedStages, STATE_FILE } from './state.js';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';

describe('createInitialState', () => {
  it('should create state with all stages pending', () => {
    const state = createInitialState('pipeline.yaml', ['requirement', 'prd', 'architecture']);
    expect(state.pipeline).toBe('pipeline.yaml');
    expect(state.current_stage).toBe('requirement');
    expect(state.stages.requirement.status).toBe('pending');
    expect(state.stages.prd.status).toBe('pending');
    expect(state.stages.requirement.attempt).toBe(0);
    expect(state.artifacts).toEqual({});
  });
});

describe('saveState and loadState', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should save and load state', () => {
    const state = createInitialState('pipe.yaml', ['a', 'b']);
    saveState(state);
    const loaded = loadState();
    expect(loaded.current_stage).toBe('a');
    expect(loaded.stages.a.status).toBe('pending');
  });
});

describe('getStageState', () => {
  const state = createInitialState('p.yaml', ['x', 'y']);

  it('should return stage state', () => {
    const s = getStageState(state, 'x');
    expect(s.status).toBe('pending');
  });

  it('should throw for unknown stage', () => {
    expect(() => getStageState(state, 'z')).toThrow();
  });
});

describe('isStageComplete', () => {
  const state = createInitialState('p.yaml', ['a', 'b']);
  state.stages.a.status = 'passed';

  it('should return true for passed stage', () => {
    expect(isStageComplete(state, 'a')).toBe(true);
  });

  it('should return false for pending stage', () => {
    expect(isStageComplete(state, 'b')).toBe(false);
  });
});

describe('getCompletedStages', () => {
  const state = createInitialState('p.yaml', ['a', 'b', 'c']);
  state.stages.a.status = 'passed';
  state.stages.c.status = 'passed';

  it('should return passed stage names', () => {
    const completed = getCompletedStages(state);
    expect(completed).toEqual(['a', 'c']);
  });
});
