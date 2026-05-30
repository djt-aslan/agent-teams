"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPipeline = initPipeline;
exports.advanceStage = advanceStage;
exports.startStage = startStage;
exports.setReviewStage = setReviewStage;
exports.setHumanReviewStage = setHumanReviewStage;
exports.markPassed = markPassed;
exports.markFailed = markFailed;
exports.retryStage = retryStage;
exports.getCurrentDispatch = getCurrentDispatch;
const config_js_1 = require("./config.js");
const state_js_1 = require("./state.js");
const dispatch_js_1 = require("./dispatch.js");
const node_fs_1 = require("node:fs");
function initPipeline(pipelinePath) {
    if ((0, node_fs_1.existsSync)('.agent-teams/state.json')) {
        throw new Error('Pipeline already initialized. Use --clean to start fresh.');
    }
    const config = (0, config_js_1.loadPipelineConfig)(pipelinePath);
    const stageNames = config.pipeline.map(s => s.stage);
    const state = (0, state_js_1.createInitialState)(pipelinePath, stageNames);
    (0, state_js_1.saveState)(state);
    return state;
}
function advanceStage(state, stageName, status) {
    const stage = state.stages[stageName];
    stage.status = status;
    stage.completed_at = new Date().toISOString();
    (0, state_js_1.saveState)(state);
    return state;
}
function startStage(state, stageName) {
    const stage = state.stages[stageName];
    stage.status = 'in_progress';
    stage.started_at = new Date().toISOString();
    stage.attempt++;
    (0, state_js_1.saveState)(state);
    return state;
}
function setReviewStage(state, stageName) {
    const stage = state.stages[stageName];
    stage.status = 'review';
    (0, state_js_1.saveState)(state);
    return state;
}
function setHumanReviewStage(state, stageName) {
    const stage = state.stages[stageName];
    stage.status = 'human_review';
    (0, state_js_1.saveState)(state);
    return state;
}
function markPassed(state, stageName) {
    const stage = state.stages[stageName];
    stage.status = 'passed';
    stage.completed_at = new Date().toISOString();
    state.artifacts[stageName] = (0, config_js_1.getStageConfig)((0, config_js_1.loadPipelineConfig)(state.pipeline), stageName).output;
    (0, state_js_1.saveState)(state);
    return state;
}
function markFailed(state, stageName) {
    const stage = state.stages[stageName];
    stage.status = 'failed';
    (0, state_js_1.saveState)(state);
    return state;
}
function retryStage(state, stageName, config) {
    const stage = state.stages[stageName];
    const stageConfig = (0, config_js_1.getStageConfig)(config, stageName);
    const maxRetries = stageConfig.max_retries ?? 3;
    if (stage.attempt >= maxRetries) {
        throw new Error(`Stage "${stageName}" exceeded max retries (${maxRetries})`);
    }
    stage.status = 'in_progress';
    (0, state_js_1.saveState)(state);
    return state;
}
function getCurrentDispatch(config, state, requirement) {
    const currentStage = state.current_stage;
    const stageConfig = (0, config_js_1.getStageConfig)(config, currentStage);
    const stageState = (0, state_js_1.getStageState)(state, currentStage);
    if (stageState.status === 'failed')
        return null;
    if (stageState.status === 'human_review')
        return null;
    if (stageState.status === 'passed')
        return null;
    let instruction;
    if (stageState.status === 'review') {
        if (!stageConfig.reviewer) {
            return null;
        }
        instruction = (0, dispatch_js_1.generateReviewDispatch)(stageConfig, state);
    }
    else {
        if (stageConfig.engine) {
            return null;
        }
        instruction = (0, dispatch_js_1.generateWorkerDispatch)(stageConfig, state, requirement);
    }
    return { instruction, formatted: (0, dispatch_js_1.formatDispatchForAI)(instruction) };
}
