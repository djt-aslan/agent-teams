import { describe, it, expect } from 'vitest';
import { loadPipelineConfig, getStageConfig, getNextStage, getDependencies, validateDependencies } from './config.js';

describe('loadPipelineConfig', () => {
  it('should load and parse pipeline.yaml', () => {
    const config = loadPipelineConfig('defaults/pipeline.yaml');
    expect(config.version).toBe('1');
    expect(config.pipeline.length).toBeGreaterThan(0);
  });

  it('should throw on invalid config', () => {
    expect(() => loadPipelineConfig('package.json')).toThrow();
  });
});

describe('getStageConfig', () => {
  const config = loadPipelineConfig('defaults/pipeline.yaml');

  it('should return stage by name', () => {
    const stage = getStageConfig(config, 'prd');
    expect(stage.stage).toBe('prd');
    expect(stage.agent).toContain('product-manager');
  });

  it('should throw for unknown stage', () => {
    expect(() => getStageConfig(config, 'nonexistent')).toThrow();
  });
});

describe('getNextStage', () => {
  const config = loadPipelineConfig('defaults/pipeline.yaml');

  it('should return next stage', () => {
    const next = getNextStage(config, 'requirement');
    expect(next).not.toBeNull();
    expect(next!.stage).toBe('prd');
  });

  it('should return null for last stage', () => {
    const next = getNextStage(config, 'report');
    expect(next).toBeNull();
  });
});

describe('getDependencies', () => {
  const config = loadPipelineConfig('defaults/pipeline.yaml');

  it('should return depends_on array', () => {
    const deps = getDependencies(config, 'prd');
    expect(deps).toContain('requirement');
  });

  it('should return empty for no dependencies', () => {
    const deps = getDependencies(config, 'requirement');
    expect(deps).toEqual([]);
  });
});

describe('validateDependencies', () => {
  const config = loadPipelineConfig('defaults/pipeline.yaml');

  it('should return unmet dependencies', () => {
    const unmet = validateDependencies(config, 'prd', []);
    expect(unmet).toContain('requirement');
  });

  it('should return empty when all deps met', () => {
    const unmet = validateDependencies(config, 'prd', ['requirement']);
    expect(unmet).toEqual([]);
  });
});
