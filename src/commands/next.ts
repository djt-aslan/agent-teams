import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadState, saveState } from '../engine/state.js';
import { loadPipelineConfig, getStageConfig, getNextStage } from '../engine/config.js';
import { startStage, setReviewStage, setHumanReviewStage, markPassed, getCurrentDispatch } from '../engine/pipeline.js';
import { validateArtifact, getReviewVerdict } from '../engine/artifact.js';
import { executeMerge, cleanWorktrees, isGitRepo } from '../engine/git.js';

const BASE = '.agent-teams';

function resolvePath(relativePath: string): string {
  return join(BASE, relativePath);
}

export function nextCommand(requirement?: string): void {
  const state = loadState();
  const config = loadPipelineConfig(state.pipeline);
  const currentStage = getStageConfig(config, state.current_stage);
  const stageState = state.stages[state.current_stage];

  if (stageState.status === 'pending') {
    if (currentStage.engine) {
      handleEngineStage(currentStage, state, config);
      return;
    }
    startStage(state, state.current_stage);
    console.log(`Starting stage: ${currentStage.stage}`);
    const dispatch = getCurrentDispatch(config, state, requirement);
    if (dispatch) console.log(dispatch.formatted);
  } else if (stageState.status === 'in_progress') {
    const artifactPath = resolvePath(currentStage.output);
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
    const reviewOutput = resolvePath(`artifacts/review-reports/${state.current_stage}-review.md`);
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
    if (!next) { console.log('Pipeline complete!'); return; }
    state.current_stage = next.stage;
    saveState(state);
    console.log(`Advanced to: ${next.stage} - ${next.description}`);
    if (next.engine) {
      handleEngineStage(next, state, config);
    } else {
      startStage(state, next.stage);
      console.log(`Auto-starting stage: ${next.stage}`);
      const dispatch = getCurrentDispatch(config, state, requirement);
      if (dispatch) console.log(dispatch.formatted);
    }
  } else if (stageState.status === 'human_review') {
    console.log('Waiting for human review.');
    console.log('  approve: agent-teams approve ' + state.current_stage);
    console.log('  reject:  agent-teams reject ' + state.current_stage);
  }
}

function handleEngineStage(stageConfig: any, state: any, config: any): void {
  if (stageConfig.action === 'merge') {
    if (!isGitRepo()) {
      console.error('Not a git repository. Cannot merge.');
      return;
    }
    const batchIds: string[] = Object.keys(state.stages.implementation?.batches ?? {});
    const worktreesDir = resolvePath('worktrees');

    console.log(`Engine: Merging ${batchIds.length || 0} batches...`);
    const result = executeMerge(
      worktreesDir,
      batchIds,
      'chore: agent-teams implementation complete'
    );

    if (result.success) {
      markPassed(state, state.current_stage);
      cleanWorktrees(worktreesDir);
      console.log('Merge successful. Stage passed.');
    } else {
      console.error(`Merge failed: ${result.error}`);
      console.log('If you cannot resolve manually, run "agent-teams next" to continue.');
    }
  }
}
