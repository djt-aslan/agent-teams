"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrontmatter = parseFrontmatter;
exports.validateArtifact = validateArtifact;
exports.getReviewVerdict = getReviewVerdict;
exports.getArtifactSummary = getArtifactSummary;
exports.readArtifactContent = readArtifactContent;
const node_fs_1 = require("node:fs");
const yaml_1 = require("yaml");
function parseFrontmatter(filePath) {
    const content = (0, node_fs_1.readFileSync)(filePath, 'utf-8').replace(/\r\n/g, '\n');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        throw new Error(`No frontmatter found in ${filePath}`);
    }
    return (0, yaml_1.parse)(match[1]);
}
function validateArtifact(filePath) {
    const errors = [];
    try {
        const fm = parseFrontmatter(filePath);
        if (!fm.stage)
            errors.push('Missing "stage" field');
        if (!fm.status)
            errors.push('Missing "status" field');
    }
    catch (e) {
        errors.push(`Frontmatter parse error: ${e.message}`);
    }
    return { valid: errors.length === 0, errors };
}
function getReviewVerdict(filePath) {
    const fm = parseFrontmatter(filePath);
    return fm.verdict ?? null;
}
function getArtifactSummary(filePath) {
    const fm = parseFrontmatter(filePath);
    return fm.summary ?? '(no summary)';
}
function readArtifactContent(filePath) {
    return (0, node_fs_1.readFileSync)(filePath, 'utf-8');
}
