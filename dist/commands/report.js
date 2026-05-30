"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCommand = reportCommand;
const state_js_1 = require("../engine/state.js");
const config_js_1 = require("../engine/config.js");
const status_js_1 = require("./status.js");
function reportCommand() {
    (0, status_js_1.statusCommand)();
    const state = (0, state_js_1.loadState)();
    const config = (0, config_js_1.loadPipelineConfig)(state.pipeline);
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
