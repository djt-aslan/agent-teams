"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const state_js_1 = require("./state.js");
const config_js_1 = require("./config.js");
const pipeline_js_1 = require("./pipeline.js");
const node_fs_1 = require("node:fs");
const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
(0, vitest_1.describe)('startStage', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should set status to in_progress', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['requirement']);
        (0, pipeline_js_1.startStage)(state, 'requirement');
        (0, vitest_1.expect)(state.stages.requirement.status).toBe('in_progress');
        (0, vitest_1.expect)(state.stages.requirement.attempt).toBe(1);
    });
});
(0, vitest_1.describe)('setReviewStage', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should set status to review', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['prd']);
        (0, pipeline_js_1.setReviewStage)(state, 'prd');
        (0, vitest_1.expect)(state.stages.prd.status).toBe('review');
    });
});
(0, vitest_1.describe)('setHumanReviewStage', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should set status to human_review', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['prd']);
        (0, pipeline_js_1.setHumanReviewStage)(state, 'prd');
        (0, vitest_1.expect)(state.stages.prd.status).toBe('human_review');
    });
});
(0, vitest_1.describe)('markPassed', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should set status to passed and record artifact', () => {
        const state = (0, state_js_1.createInitialState)('defaults/pipeline.yaml', ['requirement']);
        (0, pipeline_js_1.markPassed)(state, 'requirement');
        (0, vitest_1.expect)(state.stages.requirement.status).toBe('passed');
        (0, vitest_1.expect)(state.artifacts.requirement).toBeTruthy();
    });
});
(0, vitest_1.describe)('markFailed', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should set status to failed', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['prd']);
        (0, pipeline_js_1.markFailed)(state, 'prd');
        (0, vitest_1.expect)(state.stages.prd.status).toBe('failed');
    });
});
(0, vitest_1.describe)('retryStage', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should reset to in_progress', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['prd']);
        state.stages.prd.status = 'human_review';
        state.stages.prd.attempt = 1;
        (0, pipeline_js_1.retryStage)(state, 'prd', config);
        (0, vitest_1.expect)(state.stages.prd.status).toBe('in_progress');
    });
    (0, vitest_1.it)('should throw when exceeding max retries', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['prd']);
        state.stages.prd.attempt = 3;
        (0, vitest_1.expect)(() => (0, pipeline_js_1.retryStage)(state, 'prd', config)).toThrow('exceeded max retries');
    });
});
(0, vitest_1.describe)('getCurrentDispatch', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should return worker dispatch for pending stage', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['requirement']);
        const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state, 'test requirement');
        (0, vitest_1.expect)(dispatch).not.toBeNull();
        (0, vitest_1.expect)(dispatch.instruction.task).toBe('requirement');
    });
    (0, vitest_1.it)('should return null for human_review stage', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['prd']);
        state.stages.prd.status = 'human_review';
        const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state);
        (0, vitest_1.expect)(dispatch).toBeNull();
    });
    (0, vitest_1.it)('should return null for engine stage', () => {
        const state = (0, state_js_1.createInitialState)('p.yaml', ['merge']);
        const dispatch = (0, pipeline_js_1.getCurrentDispatch)(config, state);
        (0, vitest_1.expect)(dispatch).toBeNull();
    });
});
