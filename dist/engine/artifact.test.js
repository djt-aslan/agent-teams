"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const artifact_js_1 = require("./artifact.js");
const node_fs_1 = require("node:fs");
(0, vitest_1.describe)('parseFrontmatter', () => {
    const testFile = '.test-artifact.md';
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(testFile))
            (0, node_fs_1.unlinkSync)(testFile);
    });
    (0, vitest_1.it)('should parse valid frontmatter', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\nstage: prd\nstatus: completed\nsummary: done\n---\n\n# Content');
        const fm = (0, artifact_js_1.parseFrontmatter)(testFile);
        (0, vitest_1.expect)(fm.stage).toBe('prd');
        (0, vitest_1.expect)(fm.status).toBe('completed');
        (0, vitest_1.expect)(fm.summary).toBe('done');
    });
    (0, vitest_1.it)('should parse CRLF frontmatter', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\r\nstage: prd\r\nstatus: completed\r\n---\r\n\r\n# Content');
        const fm = (0, artifact_js_1.parseFrontmatter)(testFile);
        (0, vitest_1.expect)(fm.stage).toBe('prd');
    });
    (0, vitest_1.it)('should throw when no frontmatter', () => {
        (0, node_fs_1.writeFileSync)(testFile, '# No frontmatter here');
        (0, vitest_1.expect)(() => (0, artifact_js_1.parseFrontmatter)(testFile)).toThrow('No frontmatter found');
    });
    (0, vitest_1.it)('should parse verdict in frontmatter', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\nstage: review\nverdict: pass\nissues: []\n---\n');
        const fm = (0, artifact_js_1.parseFrontmatter)(testFile);
        (0, vitest_1.expect)(fm.verdict).toBe('pass');
        (0, vitest_1.expect)(fm.issues).toEqual([]);
    });
});
(0, vitest_1.describe)('validateArtifact', () => {
    const testFile = '.test-validate.md';
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(testFile))
            (0, node_fs_1.unlinkSync)(testFile);
    });
    (0, vitest_1.it)('should pass valid artifact', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\nstage: prd\nstatus: completed\n---\n\n# OK');
        const result = (0, artifact_js_1.validateArtifact)(testFile);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toEqual([]);
    });
    (0, vitest_1.it)('should fail missing stage', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\nstatus: completed\n---\n\n# Missing stage');
        const result = (0, artifact_js_1.validateArtifact)(testFile);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
    });
});
(0, vitest_1.describe)('getReviewVerdict', () => {
    const testFile = '.test-verdict.md';
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(testFile))
            (0, node_fs_1.unlinkSync)(testFile);
    });
    (0, vitest_1.it)('should return pass verdict', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\nstage: prd\nstatus: completed\nverdict: pass\n---\n');
        (0, vitest_1.expect)((0, artifact_js_1.getReviewVerdict)(testFile)).toBe('pass');
    });
    (0, vitest_1.it)('should return null when no verdict', () => {
        (0, node_fs_1.writeFileSync)(testFile, '---\nstage: prd\nstatus: completed\n---\n');
        (0, vitest_1.expect)((0, artifact_js_1.getReviewVerdict)(testFile)).toBeNull();
    });
});
