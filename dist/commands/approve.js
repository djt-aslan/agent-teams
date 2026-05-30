"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveCommand = approveCommand;
exports.rejectCommand = rejectCommand;
exports.retryCommand = retryCommand;
const node_fs_1 = require("node:fs");
const state_js_1 = require("../engine/state.js");
const config_js_1 = require("../engine/config.js");
const pipeline_js_1 = require("../engine/pipeline.js");
function cleanStageArtifacts(stageName) {
    const artifactPath = `.agent-teams/artifacts/${stageName}.md`;
    if ((0, node_fs_1.existsSync)(artifactPath))
        (0, node_fs_1.rmSync)(artifactPath);
    const reviewPath = `.agent-teams/artifacts/review-reports/${stageName}-review.md`;
    if ((0, node_fs_1.existsSync)(reviewPath))
        (0, node_fs_1.rmSync)(reviewPath);
}
function approveCommand(stageName) {
    const state = (0, state_js_1.loadState)();
    const config = (0, config_js_1.loadPipelineConfig)(state.pipeline);
    const stageState = state.stages[stageName];
    if (stageState.status !== 'human_review') {
        console.error(`Stage "${stageName}" is not in human review (current: ${stageState.status})`);
        return;
    }
    (0, pipeline_js_1.markPassed)(state, stageName);
    const next = (0, config_js_1.getNextStage)(config, stageName);
    if (next) {
        state.current_stage = next.stage;
        (0, state_js_1.saveState)(state);
        console.log(`Stage "${stageName}" approved. Advanced to "${next.stage}".`);
    }
    else {
        state.current_stage = stageName;
        (0, state_js_1.saveState)(state);
        console.log(`Stage "${stageName}" approved. Pipeline complete!`);
    }
}
function rejectCommand(stageName, reason) {
    const state = (0, state_js_1.loadState)();
    const config = (0, config_js_1.loadPipelineConfig)(state.pipeline);
    const stageState = state.stages[stageName];
    if (stageState.status !== 'human_review') {
        console.error(`Stage "${stageName}" is not in human review (current: ${stageState.status})`);
        return;
    }
    (0, pipeline_js_1.retryStage)(state, stageName, config);
    cleanStageArtifacts(stageName);
    console.log(`Stage "${stageName}" rejected${reason ? ': ' + reason : ''}. Stage will be retried.`);
    console.log('Run "agent-teams next" to re-dispatch the worker.');
}
function retryCommand(stageName) {
    const state = (0, state_js_1.loadState)();
    const config = (0, config_js_1.loadPipelineConfig)(state.pipeline);
    try {
        (0, pipeline_js_1.retryStage)(state, stageName, config);
        console.log(`Stage "${stageName}" marked for retry. Run "agent-teams next" to dispatch.`);
    }
    catch (e) {
        console.error(e.message);
    }
}
