import { loadState } from '../engine/state.js';
import { loadPipelineConfig } from '../engine/config.js';

export function statusCommand(): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);

  console.log('\nPipeline Status');
  console.log('='.repeat(60));
  console.log(`Started: ${state.started_at}`);

  for (const stageConfig of config.pipeline) {
    const stageState = state.stages[stageConfig.stage];
    const icon = statusIcon(stageState.status);
    const retries = stageState.attempt > 1 ? ` (attempt ${stageState.attempt})` : '';
    const isCurrent = stageConfig.stage === state.current_stage ? ' <- current' : '';

    console.log(`  ${icon} ${stageConfig.stage.padEnd(18)} ${stageState.status.padEnd(14)} ${retries}${isCurrent}`);

    if (stageConfig.stage === state.current_stage && stageState.status === 'human_review') {
      console.log('      Waiting for human review. Use "agent-teams approve" or "agent-teams reject".');
    }
  }
  console.log('='.repeat(60));
}

function statusIcon(status: string): string {
  switch (status) {
    case 'passed': return 'ok';
    case 'in_progress': return '>>';
    case 'review': return '..';
    case 'human_review': return '!!';
    case 'failed': return 'xx';
    default: return '  ';
  }
}
