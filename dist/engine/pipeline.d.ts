import type { PipelineConfig, PipelineState, StageStatus } from '../types.js';
import type { DispatchInstruction } from '../types.js';
export declare function initPipeline(pipelinePath: string): PipelineState;
export declare function advanceStage(state: PipelineState, stageName: string, status: StageStatus): PipelineState;
export declare function startStage(state: PipelineState, stageName: string): PipelineState;
export declare function setReviewStage(state: PipelineState, stageName: string): PipelineState;
export declare function setHumanReviewStage(state: PipelineState, stageName: string): PipelineState;
export declare function markPassed(state: PipelineState, stageName: string): PipelineState;
export declare function markFailed(state: PipelineState, stageName: string): PipelineState;
export declare function retryStage(state: PipelineState, stageName: string, config: PipelineConfig): PipelineState;
export declare function getCurrentDispatch(config: PipelineConfig, state: PipelineState, requirement?: string): {
    instruction: DispatchInstruction;
    formatted: string;
} | null;
