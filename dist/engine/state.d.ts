import type { PipelineState, StageState } from '../types.js';
export declare const STATE_FILE = ".agent-teams/state.json";
export declare function createInitialState(pipelinePath: string, stageNames: string[]): PipelineState;
export declare function loadState(): PipelineState;
export declare function saveState(state: PipelineState): void;
export declare function stageExists(state: PipelineState, stageName: string): boolean;
export declare function getStageState(state: PipelineState, stageName: string): StageState;
export declare function isStageComplete(state: PipelineState, stageName: string): boolean;
export declare function getCompletedStages(state: PipelineState): string[];
