import { loadState } from '../engine/state.js';
import { loadPipelineConfig } from '../engine/config.js';
import { statusCommand } from './status.js';

export function reportCommand(): void {
  statusCommand();

  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);

  console.log('\n--- Artifact Summary ---');
  for (const [stageName, artifactPath] of Object.entries(state.artifacts)) {
    const stageConfig = config.pipeline.find(s => s.stage === stageName);
    console.log(`  ${stageName}: ${artifactPath} (${stageConfig?.description ?? ''})`);
  }

  const allPassed = config.pipeline.every(s => state.stages[s.stage].status === 'passed');
  if (allPassed) {
    console.log('\nAll stages passed. Pipeline complete!');
  }
}
