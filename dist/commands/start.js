"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = startCommand;
const node_fs_1 = require("node:fs");
const pipeline_js_1 = require("../engine/pipeline.js");
const config_js_1 = require("../engine/config.js");
const node_path_1 = require("node:path");
function startCommand(requirement, options) {
    const pipelinePath = '.agent-teams/pipeline.yaml';
    if (!(0, node_fs_1.existsSync)(pipelinePath)) {
        console.error('No .agent-teams/pipeline.yaml found. Run "agent-teams init" first.');
        process.exit(1);
    }
    const artifactsDir = '.agent-teams/artifacts';
    if (!options.clean && (0, node_fs_1.existsSync)(artifactsDir)) {
        const files = (0, node_fs_1.readdirSync)(artifactsDir);
        if (files.length > 0) {
            console.log('Existing artifacts found. Use --clean to start fresh, or "agent-teams status" to resume.');
            return;
        }
    }
    if (options.clean) {
        if ((0, node_fs_1.existsSync)('.agent-teams/state.json')) {
            (0, node_fs_1.rmSync)('.agent-teams/state.json');
        }
        const dirs = ['artifacts', 'worktrees'];
        for (const dir of dirs) {
            const full = (0, node_path_1.join)('.agent-teams', dir);
            if ((0, node_fs_1.existsSync)(full)) {
                for (const entry of (0, node_fs_1.readdirSync)(full)) {
                    (0, node_fs_1.rmSync)((0, node_path_1.join)(full, entry), { recursive: true, force: true });
                }
            }
        }
        console.log('Cleaned previous state and artifacts.');
    }
    const state = (0, pipeline_js_1.initPipeline)(pipelinePath);
    let finalRequirement = requirement;
    if (options.spec) {
        if (!(0, node_fs_1.existsSync)(options.spec)) {
            console.error(`Spec file not found: ${options.spec}`);
            process.exit(1);
        }
        finalRequirement = (0, node_fs_1.readFileSync)(options.spec, 'utf-8');
        console.log(`Loaded spec from: ${options.spec}`);
    }
    const config = (0, config_js_1.loadPipelineConfig)(pipelinePath);
    const currentStage = (0, config_js_1.getStageConfig)(config, state.current_stage);
    console.log(`
========================================
Agent Teams Pipeline Started
========================================
Pipeline: ${pipelinePath}
Starting: ${currentStage.stage} - ${currentStage.description}

Use "agent-teams next" to dispatch the first task.
Use "agent-teams status" to check progress.
`);
    const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, finalRequirement);
    if (dispatch) {
        console.log('--- Dispatch Instructions ---');
        console.log(dispatch.formatted);
        console.log('Run "agent-teams next" after the agent completes.');
    }
}
