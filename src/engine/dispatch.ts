import type { StageConfig, PipelineState, DispatchInstruction } from '../types.js';
import { getStageState } from './state.js';

export function generateWorkerDispatch(
  config: StageConfig,
  state: PipelineState,
  requirement?: string
): DispatchInstruction {
  const artifacts: string[] = [];
  if (config.depends_on) {
    for (const dep of config.depends_on) {
      const depStage = state.artifacts[dep];
      if (depStage) artifacts.push(depStage);
    }
  }

  return {
    task: config.stage,
    agent: config.agent!,
    skill: config.skill!,
    output: config.output,
    context: {
      requirement,
      artifacts,
      stage: config.stage,
    },
  };
}

export function generateReviewDispatch(
  config: StageConfig,
  state: PipelineState,
  batchId?: string
): DispatchInstruction {
  let artifactPath = config.output;
  if (batchId) {
    artifactPath = `artifacts/implementation/${batchId}-report.md`;
  }

  return {
    task: 'review',
    agent: config.reviewer!.agent,
    skill: config.reviewer!.skill,
    output: `artifacts/review-reports/${config.stage}${batchId ? '-' + batchId : ''}-review.md`,
    context: {
      artifacts: [artifactPath],
      stage: config.stage,
    },
    target: {
      stage: config.stage,
      artifact: artifactPath,
    },
  };
}

export function formatDispatchForAI(instruction: DispatchInstruction): string {
  const lines: string[] = [];
  lines.push(`## Dispatch: ${instruction.task.toUpperCase()}`);
  lines.push('');
  lines.push(`**Agent:** ${instruction.agent}`);
  lines.push(`**Skill:** ${instruction.skill}`);
  lines.push(`**Output:** ${instruction.output}`);
  lines.push('');
  if (instruction.context.artifacts.length > 0) {
    lines.push('**Context artifacts (read as needed):**');
    for (const a of instruction.context.artifacts) {
      lines.push(`- ${a}`);
    }
    lines.push('');
  }
  if (instruction.context.requirement) {
    lines.push(`**User requirement:** ${instruction.context.requirement}`);
    lines.push('');
  }
  if (instruction.target) {
    lines.push(`**Review target:** ${instruction.target.artifact}`);
    lines.push('');
  }
  lines.push('---');
  return lines.join('\n');
}
