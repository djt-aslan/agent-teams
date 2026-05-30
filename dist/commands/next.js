"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextCommand = nextCommand;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const state_js_1 = require("../engine/state.js");
const config_js_1 = require("../engine/config.js");
const pipeline_js_1 = require("../engine/pipeline.js");
const artifact_js_1 = require("../engine/artifact.js");
const git_js_1 = require("../engine/git.js");
const fixer_js_1 = require("../engine/fixer.js");
const BASE = '.agent-teams';
function resolvePath(relativePath) {
    return (0, node_path_1.join)(BASE, relativePath);
}
function nextCommand(requirement) {
    const state = (0, state_js_1.loadState)();
    const config = (0, config_js_1.loadPipelineConfig)(state.pipeline);
    const currentStage = (0, config_js_1.getStageConfig)(config, state.current_stage);
    const stageState = state.stages[state.current_stage];
    if (stageState.status === 'pending') {
        if (currentStage.engine) {
            handleEngineStage(currentStage, state, config);
            return;
        }
        (0, pipeline_js_1.startStage)(state, state.current_stage);
        console.log(`Starting stage: ${currentStage.stage}`);
        const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, requirement);
        if (dispatch)
            console.log(dispatch.formatted);
    }
    else if (stageState.status === 'in_progress') {
        const artifactPath = resolvePath(currentStage.output);
        if (!(0, node_fs_1.existsSync)(artifactPath)) {
            // Crash recovery or retry: artifact was lost/deleted, re-dispatch worker
            console.log(`Artifact not found (crash recovery): ${artifactPath}`);
            console.log('Re-dispatching worker...');
            if (currentStage.mode === 'tdd' && currentStage.parallel) {
                (0, git_js_1.cleanWorktrees)(resolvePath('worktrees'));
            }
            const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, requirement);
            if (dispatch)
                console.log(dispatch.formatted);
            return;
        }
        const validation = (0, artifact_js_1.validateArtifact)(artifactPath);
        if (!validation.valid) {
            console.error('Artifact validation failed:');
            for (const err of validation.errors)
                console.error(`  - ${err}`);
            return;
        }
        if (currentStage.review === false || !currentStage.reviewer) {
            (0, pipeline_js_1.setHumanReviewStage)(state, state.current_stage);
            console.log(`Stage "${state.current_stage}" completed. Ready for human review.`);
            console.log('Use "agent-teams approve <stage>" or "agent-teams reject <stage>".');
        }
        else {
            (0, pipeline_js_1.setReviewStage)(state, state.current_stage);
            console.log(`Stage "${state.current_stage}" completed. Dispatching review...`);
            const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, requirement);
            if (dispatch)
                console.log(dispatch.formatted);
        }
    }
    else if (stageState.status === 'review') {
        const reviewOutput = resolvePath(`artifacts/review-reports/${state.current_stage}-review.md`);
        if (!(0, node_fs_1.existsSync)(reviewOutput)) {
            // Crash recovery: review was lost, re-dispatch reviewer
            console.log(`Review report not found (crash recovery): ${reviewOutput}`);
            console.log('Re-dispatching review...');
            const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, requirement);
            if (dispatch)
                console.log(dispatch.formatted);
            return;
        }
        const verdict = (0, artifact_js_1.getReviewVerdict)(reviewOutput);
        stageState.review_verdict = verdict ?? undefined;
        (0, pipeline_js_1.setHumanReviewStage)(state, state.current_stage);
        console.log(`Review complete for "${state.current_stage}"`);
        console.log(`Verdict: ${verdict ?? '(unknown)'}`);
        console.log('\nReady for human review.');
        console.log('  approve: agent-teams approve ' + state.current_stage);
        console.log('  reject:  agent-teams reject ' + state.current_stage);
    }
    else if (stageState.status === 'passed') {
        const next = (0, config_js_1.getNextStage)(config, state.current_stage);
        if (!next) {
            console.log('Pipeline complete!');
            return;
        }
        state.current_stage = next.stage;
        (0, state_js_1.saveState)(state);
        console.log(`Advanced to: ${next.stage} - ${next.description}`);
        if (next.engine) {
            handleEngineStage(next, state, config);
        }
        else {
            (0, pipeline_js_1.startStage)(state, next.stage);
            console.log(`Auto-starting stage: ${next.stage}`);
            const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, requirement);
            if (dispatch)
                console.log(dispatch.formatted);
        }
    }
    else if (stageState.status === 'human_review') {
        console.log('Waiting for human review.');
        console.log('  approve: agent-teams approve ' + state.current_stage);
        console.log('  reject:  agent-teams reject ' + state.current_stage);
    }
}
function handleEngineStage(stageConfig, state, config) {
    if (stageConfig.action === 'merge') {
        if (!(0, git_js_1.isGitRepo)()) {
            console.error('Not a git repository. Cannot merge.');
            return;
        }
        const batchIds = Object.keys(state.stages.implementation?.batches ?? {});
        const worktreesDir = resolvePath('worktrees');
        console.log(`Engine: Merging ${batchIds.length || 0} batches...`);
        const result = (0, git_js_1.executeMerge)(worktreesDir, batchIds, 'chore: agent-teams implementation complete');
        if (result.success) {
            (0, pipeline_js_1.markPassed)(state, state.current_stage);
            (0, git_js_1.cleanWorktrees)(worktreesDir);
            console.log('Merge successful. Stage passed.');
        }
        else {
            console.error(`Merge failed: ${result.error}`);
            const fixerDispatch = (0, fixer_js_1.generateFixerDispatch)(new Error(result.error ?? 'Unknown merge error'), 'Git merge operation');
            console.log((0, fixer_js_1.formatFixerForAI)(fixerDispatch));
        }
    }
}
