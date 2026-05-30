import type { StageConfig, PipelineState, DispatchInstruction } from '../types.js';
export declare function generateWorkerDispatch(config: StageConfig, state: PipelineState, requirement?: string): DispatchInstruction;
export declare function generateReviewDispatch(config: StageConfig, state: PipelineState, batchId?: string): DispatchInstruction;
export declare function formatDispatchForAI(instruction: DispatchInstruction): string;
