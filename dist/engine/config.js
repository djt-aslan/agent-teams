"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPipelineConfig = loadPipelineConfig;
exports.getStageConfig = getStageConfig;
exports.getNextStage = getNextStage;
exports.getDependencies = getDependencies;
exports.validateDependencies = validateDependencies;
const node_fs_1 = require("node:fs");
const yaml_1 = require("yaml");
function loadPipelineConfig(pipelinePath) {
    const content = (0, node_fs_1.readFileSync)(pipelinePath, 'utf-8');
    const config = (0, yaml_1.parse)(content);
    validateConfig(config);
    return config;
}
function getStageConfig(config, stageName) {
    const stage = config.pipeline.find(s => s.stage === stageName);
    if (!stage) {
        throw new Error(`Stage "${stageName}" not found in pipeline config`);
    }
    return stage;
}
function getNextStage(config, currentStage) {
    const idx = config.pipeline.findIndex(s => s.stage === currentStage);
    if (idx === -1 || idx >= config.pipeline.length - 1)
        return null;
    return config.pipeline[idx + 1];
}
function getDependencies(config, stageName) {
    const stage = getStageConfig(config, stageName);
    return stage.depends_on ?? [];
}
function validateDependencies(config, stageName, completedStages) {
    const deps = getDependencies(config, stageName);
    return deps.filter(d => !completedStages.includes(d));
}
function validateConfig(config) {
    if (!config.version)
        throw new Error('Pipeline config missing version');
    if (!config.pipeline || !Array.isArray(config.pipeline)) {
        throw new Error('Pipeline config missing pipeline array');
    }
    for (const stage of config.pipeline) {
        if (!stage.stage)
            throw new Error('Stage missing name');
        if (!stage.output && !stage.engine)
            throw new Error(`Stage "${stage.stage}" missing output path`);
    }
}
