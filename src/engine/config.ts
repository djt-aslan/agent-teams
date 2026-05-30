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
    if (!stage.output && !stage.engine) throw new Error(`Stage "${stage.stage}" missing output path`);
  }
}
