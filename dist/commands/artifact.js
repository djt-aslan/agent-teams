"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.artifactCommand = artifactCommand;
const node_fs_1 = require("node:fs");
const state_js_1 = require("../engine/state.js");
const artifact_js_1 = require("../engine/artifact.js");
function artifactCommand(stageName) {
    const state = (0, state_js_1.loadState)();
    const artifactPath = state.artifacts[stageName];
    if (!artifactPath || !(0, node_fs_1.existsSync)(artifactPath)) {
        console.error(`No artifact found for stage "${stageName}"`);
        return;
    }
    const fm = (0, artifact_js_1.parseFrontmatter)(artifactPath);
    const content = (0, node_fs_1.readFileSync)(artifactPath, 'utf-8');
    console.log(`\n=== ${stageName.toUpperCase()} ===`);
    console.log(`Status: ${fm.status}`);
    if (fm.summary)
        console.log(`Summary: ${fm.summary}`);
    if (fm.verdict)
        console.log(`Review: ${fm.verdict}`);
    if (fm.issues && fm.issues.length > 0) {
        console.log('Issues:');
        for (const issue of fm.issues)
            console.log(`  - ${issue}`);
    }
    console.log('\n--- Content ---\n');
    console.log(content);
}
