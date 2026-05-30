"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dispatch_js_1 = require("./dispatch.js");
const config_js_1 = require("./config.js");
const state_js_1 = require("./state.js");
const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
(0, vitest_1.describe)('generateWorkerDispatch', () => {
    (0, vitest_1.it)('should create dispatch with agent, skill, output', () => {
        const stageConfig = (0, config_js_1.getStageConfig)(config, 'prd');
        const state = (0, state_js_1.createInitialState)('p.yaml', config.pipeline.map(s => s.stage));
        const dispatch = (0, dispatch_js_1.generateWorkerDispatch)(stageConfig, state, 'build todo api');
        (0, vitest_1.expect)(dispatch.task).toBe('prd');
        (0, vitest_1.expect)(dispatch.agent).toBe('agents/product-manager.md');
        (0, vitest_1.expect)(dispatch.skill).toBe('skills/prd-writing.md');
        (0, vitest_1.expect)(dispatch.output).toContain('artifacts/prd.md');
        (0, vitest_1.expect)(dispatch.context.requirement).toBe('build todo api');
    });
    (0, vitest_1.it)('should include dependency artifacts in context', () => {
        const stageConfig = (0, config_js_1.getStageConfig)(config, 'prd');
        const state = (0, state_js_1.createInitialState)('p.yaml', config.pipeline.map(s => s.stage));
        state.artifacts.requirement = 'artifacts/requirement.md';
        const dispatch = (0, dispatch_js_1.generateWorkerDispatch)(stageConfig, state);
        (0, vitest_1.expect)(dispatch.context.artifacts.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(dispatch.context.artifacts[0]).toContain('requirement.md');
    });
});
(0, vitest_1.describe)('generateReviewDispatch', () => {
    (0, vitest_1.it)('should create review dispatch with target artifact', () => {
        const stageConfig = (0, config_js_1.getStageConfig)(config, 'prd');
        const state = (0, state_js_1.createInitialState)('p.yaml', config.pipeline.map(s => s.stage));
        const dispatch = (0, dispatch_js_1.generateReviewDispatch)(stageConfig, state);
        (0, vitest_1.expect)(dispatch.task).toBe('review');
        (0, vitest_1.expect)(dispatch.agent).toBe('agents/reviewer.md');
        (0, vitest_1.expect)(dispatch.skill).toBe('skills/prd-review.md');
        (0, vitest_1.expect)(dispatch.target).toBeDefined();
        (0, vitest_1.expect)(dispatch.target.stage).toBe('prd');
        (0, vitest_1.expect)(dispatch.target.artifact).toContain('artifacts/prd.md');
    });
});
(0, vitest_1.describe)('formatDispatchForAI', () => {
    (0, vitest_1.it)('should format dispatch as markdown', () => {
        const stageConfig = (0, config_js_1.getStageConfig)(config, 'prd');
        const state = (0, state_js_1.createInitialState)('p.yaml', config.pipeline.map(s => s.stage));
        const dispatch = (0, dispatch_js_1.generateWorkerDispatch)(stageConfig, state, 'test');
        const formatted = (0, dispatch_js_1.formatDispatchForAI)(dispatch);
        (0, vitest_1.expect)(formatted).toContain('## Dispatch: PRD');
        (0, vitest_1.expect)(formatted).toContain('**Agent:**');
        (0, vitest_1.expect)(formatted).toContain('**Skill:**');
        (0, vitest_1.expect)(formatted).toContain('**Output:**');
        (0, vitest_1.expect)(formatted).toContain('**User requirement:** test');
    });
    (0, vitest_1.it)('should include target section for review dispatch', () => {
        const stageConfig = (0, config_js_1.getStageConfig)(config, 'prd');
        const state = (0, state_js_1.createInitialState)('p.yaml', config.pipeline.map(s => s.stage));
        const dispatch = (0, dispatch_js_1.generateReviewDispatch)(stageConfig, state);
        const formatted = (0, dispatch_js_1.formatDispatchForAI)(dispatch);
        (0, vitest_1.expect)(formatted).toContain('**Review target:**');
    });
});
