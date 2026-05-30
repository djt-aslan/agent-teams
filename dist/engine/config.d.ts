import type { PipelineConfig, StageConfig } from '../types.js';
export declare function loadPipelineConfig(pipelinePath: string): PipelineConfig;
export declare function getStageConfig(config: PipelineConfig, stageName: string): StageConfig;
export declare function getNextStage(config: PipelineConfig, currentStage: string): StageConfig | null;
export declare function getDependencies(config: PipelineConfig, stageName: string): string[];
export declare function validateDependencies(config: PipelineConfig, stageName: string, completedStages: string[]): string[];
