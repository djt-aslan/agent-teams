"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATE_FILE = void 0;
exports.createInitialState = createInitialState;
exports.loadState = loadState;
exports.saveState = saveState;
exports.stageExists = stageExists;
exports.getStageState = getStageState;
exports.isStageComplete = isStageComplete;
exports.getCompletedStages = getCompletedStages;
const node_fs_1 = require("node:fs");
exports.STATE_FILE = '.agent-teams/state.json';
function createInitialState(pipelinePath, stageNames) {
    const stages = {};
    for (const name of stageNames) {
        stages[name] = { status: 'pending', attempt: 0 };
    }
    return {
        pipeline: pipelinePath,
        current_stage: stageNames[0],
        stages,
        started_at: new Date().toISOString(),
        artifacts: {},
    };
}
function loadState() {
    if (!(0, node_fs_1.existsSync)(exports.STATE_FILE)) {
        throw new Error('No pipeline running. Run "agent-teams start" first.');
    }
    const content = (0, node_fs_1.readFileSync)(exports.STATE_FILE, 'utf-8');
    return JSON.parse(content);
}
function saveState(state) {
    (0, node_fs_1.writeFileSync)(exports.STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}
function stageExists(state, stageName) {
    return stageName in state.stages;
}
function getStageState(state, stageName) {
    if (!stageExists(state, stageName)) {
        throw new Error(`Stage "${stageName}" not found`);
    }
    return state.stages[stageName];
}
function isStageComplete(state, stageName) {
    const s = getStageState(state, stageName);
    return s.status === 'passed';
}
function getCompletedStages(state) {
    return Object.entries(state.stages)
        .filter(([_, s]) => s.status === 'passed')
        .map(([name]) => name);
}
