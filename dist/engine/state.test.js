"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const state_js_1 = require("./state.js");
const node_fs_1 = require("node:fs");
(0, vitest_1.describe)('createInitialState', () => {
    (0, vitest_1.it)('should create state with all stages pending', () => {
        const state = (0, state_js_1.createInitialState)('pipeline.yaml', ['requirement', 'prd', 'architecture']);
        (0, vitest_1.expect)(state.pipeline).toBe('pipeline.yaml');
        (0, vitest_1.expect)(state.current_stage).toBe('requirement');
        (0, vitest_1.expect)(state.stages.requirement.status).toBe('pending');
        (0, vitest_1.expect)(state.stages.prd.status).toBe('pending');
        (0, vitest_1.expect)(state.stages.requirement.attempt).toBe(0);
        (0, vitest_1.expect)(state.artifacts).toEqual({});
    });
});
(0, vitest_1.describe)('saveState and loadState', () => {
    (0, vitest_1.beforeEach)(() => {
        if (!(0, node_fs_1.existsSync)('.agent-teams')) {
            (0, node_fs_1.mkdirSync)('.agent-teams', { recursive: true });
        }
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(state_js_1.STATE_FILE))
            (0, node_fs_1.unlinkSync)(state_js_1.STATE_FILE);
    });
    (0, vitest_1.it)('should save and load state', () => {
        const state = (0, state_js_1.createInitialState)('pipe.yaml', ['a', 'b']);
        (0, state_js_1.saveState)(state);
        const loaded = (0, state_js_1.loadState)();
        (0, vitest_1.expect)(loaded.current_stage).toBe('a');
        (0, vitest_1.expect)(loaded.stages.a.status).toBe('pending');
    });
});
(0, vitest_1.describe)('getStageState', () => {
    const state = (0, state_js_1.createInitialState)('p.yaml', ['x', 'y']);
    (0, vitest_1.it)('should return stage state', () => {
        const s = (0, state_js_1.getStageState)(state, 'x');
        (0, vitest_1.expect)(s.status).toBe('pending');
    });
    (0, vitest_1.it)('should throw for unknown stage', () => {
        (0, vitest_1.expect)(() => (0, state_js_1.getStageState)(state, 'z')).toThrow();
    });
});
(0, vitest_1.describe)('isStageComplete', () => {
    const state = (0, state_js_1.createInitialState)('p.yaml', ['a', 'b']);
    state.stages.a.status = 'passed';
    (0, vitest_1.it)('should return true for passed stage', () => {
        (0, vitest_1.expect)((0, state_js_1.isStageComplete)(state, 'a')).toBe(true);
    });
    (0, vitest_1.it)('should return false for pending stage', () => {
        (0, vitest_1.expect)((0, state_js_1.isStageComplete)(state, 'b')).toBe(false);
    });
});
(0, vitest_1.describe)('getCompletedStages', () => {
    const state = (0, state_js_1.createInitialState)('p.yaml', ['a', 'b', 'c']);
    state.stages.a.status = 'passed';
    state.stages.c.status = 'passed';
    (0, vitest_1.it)('should return passed stage names', () => {
        const completed = (0, state_js_1.getCompletedStages)(state);
        (0, vitest_1.expect)(completed).toEqual(['a', 'c']);
    });
});
