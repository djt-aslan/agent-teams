import type { DispatchInstruction } from '../types.js';
export interface FixerConfig {
    agent: string;
    skill: string;
}
export declare function generateFixerDispatch(error: Error, context: string, fixerConfig?: FixerConfig): DispatchInstruction;
export declare function formatFixerForAI(instruction: DispatchInstruction): string;
