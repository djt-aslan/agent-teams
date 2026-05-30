import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInitialState, saveState, STATE_FILE } from './state.js';
import { loadPipelineConfig, getStageConfig } from './config.js';
import {
  startStage, setReviewStage, setHumanReviewStage, markPassed,
  markFailed, retryStage, getCurrentDispatch
} from './pipeline.js';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';

const config = loadPipelineConfig('defaults/pipeline.yaml');

describe('startStage', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should set status to in_progress', () => {
    const state = createInitialState('p.yaml', ['requirement']);
    startStage(state, 'requirement');
    expect(state.stages.requirement.status).toBe('in_progress');
    expect(state.stages.requirement.attempt).toBe(1);
  });
});

describe('setReviewStage', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should set status to review', () => {
    const state = createInitialState('p.yaml', ['prd']);
    setReviewStage(state, 'prd');
    expect(state.stages.prd.status).toBe('review');
  });
});

describe('setHumanReviewStage', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should set status to human_review', () => {
    const state = createInitialState('p.yaml', ['prd']);
    setHumanReviewStage(state, 'prd');
    expect(state.stages.prd.status).toBe('human_review');
  });
});

describe('markPassed', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should set status to passed and record artifact', () => {
    const state = createInitialState('defaults/pipeline.yaml', ['requirement']);
    markPassed(state, 'requirement');
    expect(state.stages.requirement.status).toBe('passed');
    expect(state.artifacts.requirement).toBeTruthy();
  });
});

describe('markFailed', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should set status to failed', () => {
    const state = createInitialState('p.yaml', ['prd']);
    markFailed(state, 'prd');
    expect(state.stages.prd.status).toBe('failed');
  });
});

describe('retryStage', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should reset to in_progress', () => {
    const state = createInitialState('p.yaml', ['prd']);
    state.stages.prd.status = 'human_review';
    state.stages.prd.attempt = 1;
    retryStage(state, 'prd', config);
    expect(state.stages.prd.status).toBe('in_progress');
  });

  it('should throw when exceeding max retries', () => {
    const state = createInitialState('p.yaml', ['prd']);
    state.stages.prd.attempt = 3;
    expect(() => retryStage(state, 'prd', config)).toThrow('exceeded max retries');
  });
});

describe('getCurrentDispatch', () => {
  beforeEach(() => {
    if (!existsSync('.agent-teams')) {
      mkdirSync('.agent-teams', { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  });

  it('should return worker dispatch for pending stage', () => {
    const state = createInitialState('p.yaml', ['requirement']);
    const dispatch = getCurrentDispatch(config, state, 'test requirement');
    expect(dispatch).not.toBeNull();
    expect(dispatch!.instruction.task).toBe('requirement');
  });

  it('should return null for human_review stage', () => {
    const state = createInitialState('p.yaml', ['prd']);
    state.stages.prd.status = 'human_review';
    const dispatch = getCurrentDispatch(config, state);
    expect(dispatch).toBeNull();
  });

  it('should return null for engine stage', () => {
    const state = createInitialState('p.yaml', ['merge']);
    const dispatch = getCurrentDispatch(config, state);
    expect(dispatch).toBeNull();
  });
});
