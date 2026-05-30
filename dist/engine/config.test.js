"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_js_1 = require("./config.js");
(0, vitest_1.describe)('loadPipelineConfig', () => {
    (0, vitest_1.it)('should load and parse pipeline.yaml', () => {
        const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
        (0, vitest_1.expect)(config.version).toBe('1');
        (0, vitest_1.expect)(config.pipeline.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should throw on invalid config', () => {
        (0, vitest_1.expect)(() => (0, config_js_1.loadPipelineConfig)('package.json')).toThrow();
    });
});
(0, vitest_1.describe)('getStageConfig', () => {
    const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
    (0, vitest_1.it)('should return stage by name', () => {
        const stage = (0, config_js_1.getStageConfig)(config, 'prd');
        (0, vitest_1.expect)(stage.stage).toBe('prd');
        (0, vitest_1.expect)(stage.agent).toContain('product-manager');
    });
    (0, vitest_1.it)('should throw for unknown stage', () => {
        (0, vitest_1.expect)(() => (0, config_js_1.getStageConfig)(config, 'nonexistent')).toThrow();
    });
});
(0, vitest_1.describe)('getNextStage', () => {
    const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
    (0, vitest_1.it)('should return next stage', () => {
        const next = (0, config_js_1.getNextStage)(config, 'requirement');
        (0, vitest_1.expect)(next).not.toBeNull();
        (0, vitest_1.expect)(next.stage).toBe('prd');
    });
    (0, vitest_1.it)('should return null for last stage', () => {
        const next = (0, config_js_1.getNextStage)(config, 'report');
        (0, vitest_1.expect)(next).toBeNull();
    });
});
(0, vitest_1.describe)('getDependencies', () => {
    const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
    (0, vitest_1.it)('should return depends_on array', () => {
        const deps = (0, config_js_1.getDependencies)(config, 'prd');
        (0, vitest_1.expect)(deps).toContain('requirement');
    });
    (0, vitest_1.it)('should return empty for no dependencies', () => {
        const deps = (0, config_js_1.getDependencies)(config, 'requirement');
        (0, vitest_1.expect)(deps).toEqual([]);
    });
});
(0, vitest_1.describe)('validateDependencies', () => {
    const config = (0, config_js_1.loadPipelineConfig)('defaults/pipeline.yaml');
    (0, vitest_1.it)('should return unmet dependencies', () => {
        const unmet = (0, config_js_1.validateDependencies)(config, 'prd', []);
        (0, vitest_1.expect)(unmet).toContain('requirement');
    });
    (0, vitest_1.it)('should return empty when all deps met', () => {
        const unmet = (0, config_js_1.validateDependencies)(config, 'prd', ['requirement']);
        (0, vitest_1.expect)(unmet).toEqual([]);
    });
});
