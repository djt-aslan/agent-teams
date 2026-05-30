import { existsSync } from 'node:fs';
import { loadState, saveState } from '../engine/state.js';
import { loadPipelineConfig, getStageConfig, getNextStage } from '../engine/config.js';
import { startStage, advanceStage, setReviewStage, setHumanReviewStage, getCurrentDispatch } from '../engine/pipeline.js';
import { validateArtifact, getReviewVerdict } from '../engine/artifact.js';

export function nextCommand(requirement?: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  const currentStage = getStageConfig(config, state.current_stage);
  const stageState = state.stages[state.current_stage];

  if (stageState.status === 'pending') {
    startStage(state, state.current_stage);
    console.log(`Starting stage: ${currentStage.stage}`);
    if (currentStage.engine) {
      console.log(`Stage "${currentStage.stage}" is engine-executed. See merge implementation for details.`);
      return;
    }
    const dispatch = getCurrentDispatch(config, state, requirement);
    if (dispatch) console.log(dispatch.formatted);
  } else if (stageState.status === 'in_progress') {
    const artifactPath = currentStage.output;
    if (!existsSync(artifactPath)) {
      console.error(`Artifact not found: ${artifactPath}`);
      console.log('The agent should produce the artifact specified in the dispatch instructions.');
      return;
    }

    const validation = validateArtifact(artifactPath);
    if (!validation.valid) {
      console.error('Artifact validation failed:');
      for (const err of validation.errors) console.error(`  - ${err}`);
      return;
    }

    if (currentStage.review === false || !currentStage.reviewer) {
      setHumanReviewStage(state, state.current_stage);
      console.log(`Stage "${state.current_stage}" completed. Ready for human review.`);
      console.log('Use "agent-teams approve <stage>" or "agent-teams reject <stage>".');
    } else {
      setReviewStage(state, state.current_stage);
      console.log(`Stage "${state.current_stage}" completed. Dispatching review...`);
      const dispatch = getCurrentDispatch(config, state, requirement);
      if (dispatch) console.log(dispatch.formatted);
    }
  } else if (stageState.status === 'review') {
    const reviewOutput = `artifacts/review-reports/${state.current_stage}-review.md`;
    if (!existsSync(reviewOutput)) {
      console.error(`Review report not found: ${reviewOutput}`);
      return;
    }

    const verdict = getReviewVerdict(reviewOutput);
    stageState.review_verdict = verdict ?? undefined;
    setHumanReviewStage(state, state.current_stage);
    console.log(`Review complete for "${state.current_stage}"`);
    console.log(`Verdict: ${verdict ?? '(unknown)'}`);
    console.log('\nReady for human review.');
    console.log('  approve: agent-teams approve ' + state.current_stage);
    console.log('  reject:  agent-teams reject ' + state.current_stage);
  } else if (stageState.status === 'passed') {
    const next = getNextStage(config, state.current_stage);
    if (!next) { console.log('All stages complete!'); return; }
    advanceStage(state, state.current_stage, 'passed');
    state.current_stage = next.stage;
    saveState(state);
    console.log(`Advanced to: ${next.stage} - ${next.description}`);
    if (next.engine) {
      console.log(`Stage "${next.stage}" will be executed by the engine.`);
    }
  } else if (stageState.status === 'human_review') {
    console.log('Waiting for human review.');
    console.log('  approve: agent-teams approve ' + state.current_stage);
    console.log('  reject:  agent-teams reject ' + state.current_stage);
  }
}
