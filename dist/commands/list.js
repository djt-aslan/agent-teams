"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommand = listCommand;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function listCommand(resource) {
    const basePath = (0, node_path_1.join)('.agent-teams');
    const resourcePath = (0, node_path_1.join)(basePath, resource);
    if (!(0, node_fs_1.existsSync)(resourcePath)) {
        console.error(`No "${resource}" directory found in .agent-teams/`);
        return;
    }
    console.log(`\n${resource.toUpperCase()}:`);
    console.log('='.repeat(40));
    if (resource === 'standards') {
        listRecursive(resourcePath, '');
    }
    else {
        for (const file of (0, node_fs_1.readdirSync)(resourcePath)) {
            if (file.endsWith('.md') || file.endsWith('.yaml')) {
                console.log(`  ${file.replace('.md', '').replace('.yaml', '')}`);
            }
        }
    }
    console.log('');
}
function listRecursive(dir, prefix) {
    for (const entry of (0, node_fs_1.readdirSync)(dir)) {
        const full = (0, node_path_1.join)(dir, entry);
        if ((0, node_fs_1.statSync)(full).isDirectory()) {
            console.log(`  ${prefix}${entry}/`);
            listRecursive(full, prefix + '  ');
        }
        else if (entry.endsWith('.md')) {
            console.log(`  ${prefix}${entry.replace('.md', '')}`);
        }
    }
}
