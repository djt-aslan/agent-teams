import { describe, it, expect } from 'vitest';
import { generateWorkerDispatch, generateReviewDispatch, formatDispatchForAI } from './dispatch.js';
import { loadPipelineConfig, getStageConfig } from './config.js';
import { createInitialState } from './state.js';

const config = loadPipelineConfig('defaults/pipeline.yaml');

describe('generateWorkerDispatch', () => {
  it('should create dispatch with agent, skill, output', () => {
    const stageConfig = getStageConfig(config, 'prd');
    const state = createInitialState('p.yaml', config.pipeline.map(s => s.stage));
    const dispatch = generateWorkerDispatch(stageConfig, state, 'build todo api');

    expect(dispatch.task).toBe('prd');
    expect(dispatch.agent).toBe('agents/product-manager.md');
    expect(dispatch.skill).toBe('skills/prd-writing.md');
    expect(dispatch.output).toContain('artifacts/prd.md');
    expect(dispatch.context.requirement).toBe('build todo api');
  });

  it('should include dependency artifacts in context', () => {
    const stageConfig = getStageConfig(config, 'prd');
    const state = createInitialState('p.yaml', config.pipeline.map(s => s.stage));
    state.artifacts.requirement = 'artifacts/requirement.md';
    const dispatch = generateWorkerDispatch(stageConfig, state);

    expect(dispatch.context.artifacts.length).toBeGreaterThan(0);
    expect(dispatch.context.artifacts[0]).toContain('requirement.md');
  });
});

describe('generateReviewDispatch', () => {
  it('should create review dispatch with target artifact', () => {
    const stageConfig = getStageConfig(config, 'prd');
    const state = createInitialState('p.yaml', config.pipeline.map(s => s.stage));
    const dispatch = generateReviewDispatch(stageConfig, state);

    expect(dispatch.task).toBe('review');
    expect(dispatch.agent).toBe('agents/reviewer.md');
    expect(dispatch.skill).toBe('skills/prd-review.md');
    expect(dispatch.target).toBeDefined();
    expect(dispatch.target!.stage).toBe('prd');
    expect(dispatch.target!.artifact).toContain('artifacts/prd.md');
  });
});

describe('formatDispatchForAI', () => {
  it('should format dispatch as markdown', () => {
    const stageConfig = getStageConfig(config, 'prd');
    const state = createInitialState('p.yaml', config.pipeline.map(s => s.stage));
    const dispatch = generateWorkerDispatch(stageConfig, state, 'test');
    const formatted = formatDispatchForAI(dispatch);

    expect(formatted).toContain('## Dispatch: PRD');
    expect(formatted).toContain('**Agent:**');
    expect(formatted).toContain('**Skill:**');
    expect(formatted).toContain('**Output:**');
    expect(formatted).toContain('**User requirement:** test');
  });

  it('should include target section for review dispatch', () => {
    const stageConfig = getStageConfig(config, 'prd');
    const state = createInitialState('p.yaml', config.pipeline.map(s => s.stage));
    const dispatch = generateReviewDispatch(stageConfig, state);
    const formatted = formatDispatchForAI(dispatch);

    expect(formatted).toContain('**Review target:**');
  });
});
