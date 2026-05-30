import type { DispatchInstruction } from '../types.js';
import { formatDispatchForAI } from './dispatch.js';

export interface FixerConfig {
  agent: string;
  skill: string;
}

const DEFAULT_FIXER: FixerConfig = {
  agent: 'agents/reviewer.md',
  skill: 'skills/code-review.md',
};

export function generateFixerDispatch(
  error: Error,
  context: string,
  fixerConfig: FixerConfig = DEFAULT_FIXER
): DispatchInstruction {
  return {
    task: 'fix',
    agent: fixerConfig.agent,
    skill: fixerConfig.skill,
    output: '(no output - fix only)',
    context: {
      artifacts: [],
      stage: 'error-recovery',
      requirement: `The following operation failed: ${context}\n\nError:\n\`\`\`\n${error.message}\n\`\`\`\n\nPlease diagnose and fix this issue. Then instruct the user to resume by running "agent-teams next".`,
    },
  };
}

export function formatFixerForAI(instruction: DispatchInstruction): string {
  return `## ERROR RECOVERY\n\n${formatDispatchForAI(instruction)}\n\nAfter fixing, tell the user to run "agent-teams next" to continue.`;
}
