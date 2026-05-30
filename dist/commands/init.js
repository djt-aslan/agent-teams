"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function initCommand() {
    const targetPath = (0, node_path_1.join)(process.cwd(), '.agent-teams');
    const defaultsPath = findDefaultsPath();
    if ((0, node_fs_1.existsSync)(targetPath)) {
        console.log('.agent-teams/ already exists. Use --clean to overwrite.');
        return;
    }
    (0, node_fs_1.mkdirSync)(targetPath, { recursive: true });
    copyDir(defaultsPath, targetPath);
    (0, node_fs_1.mkdirSync)((0, node_path_1.join)(targetPath, 'artifacts'), { recursive: true });
    (0, node_fs_1.mkdirSync)((0, node_path_1.join)(targetPath, 'artifacts', 'implementation'), { recursive: true });
    (0, node_fs_1.mkdirSync)((0, node_path_1.join)(targetPath, 'artifacts', 'review-reports'), { recursive: true });
    (0, node_fs_1.mkdirSync)((0, node_path_1.join)(targetPath, 'worktrees'), { recursive: true });
    // Copy OpenCode commands to project root
    const opencodeSrc = (0, node_path_1.join)(findDefaultsPath(), '.opencode');
    if ((0, node_fs_1.existsSync)(opencodeSrc)) {
        const opencodeDest = (0, node_path_1.join)(process.cwd(), '.opencode');
        copyDir(opencodeSrc, opencodeDest);
    }
    console.log(`
Agent Teams initialized!

Created: .agent-teams/
  ├── pipeline.yaml
  ├── agents/        (${countFiles((0, node_path_1.join)(targetPath, 'agents'))} agents)
  ├── skills/        (${countFiles((0, node_path_1.join)(targetPath, 'skills'))} skills)
  ├── standards/     (${countFilesRecursive((0, node_path_1.join)(targetPath, 'standards'))} standards)
  ├── artifacts/
  └── worktrees/

Next: agent-teams start "your requirement description"
`);
}
function findDefaultsPath() {
    const candidates = [
        (0, node_path_1.join)(__dirname, '..', '..', 'defaults'),
        (0, node_path_1.join)(__dirname, '..', 'defaults'),
    ];
    for (const candidate of candidates) {
        if ((0, node_fs_1.existsSync)(candidate)) {
            return candidate;
        }
    }
    throw new Error('Cannot find defaults directory');
}
function copyDir(src, dest) {
    if (!(0, node_fs_1.existsSync)(dest)) {
        (0, node_fs_1.mkdirSync)(dest, { recursive: true });
    }
    for (const entry of (0, node_fs_1.readdirSync)(src)) {
        const srcPath = (0, node_path_1.join)(src, entry);
        const destPath = (0, node_path_1.join)(dest, entry);
        if ((0, node_fs_1.statSync)(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        }
        else {
            (0, node_fs_1.cpSync)(srcPath, destPath);
        }
    }
}
function countFiles(dir) {
    return (0, node_fs_1.readdirSync)(dir).filter(f => (0, node_fs_1.statSync)((0, node_path_1.join)(dir, f)).isFile()).length;
}
function countFilesRecursive(dir) {
    let count = 0;
    for (const entry of (0, node_fs_1.readdirSync)(dir)) {
        const full = (0, node_path_1.join)(dir, entry);
        if ((0, node_fs_1.statSync)(full).isDirectory()) {
            count += countFilesRecursive(full);
        }
        else {
            count++;
        }
    }
    return count;
}
