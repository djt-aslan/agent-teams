"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitRepo = isGitRepo;
exports.getCurrentBranch = getCurrentBranch;
exports.createWorktree = createWorktree;
exports.removeWorktree = removeWorktree;
exports.cleanWorktrees = cleanWorktrees;
exports.mergeWorktree = mergeWorktree;
exports.commitChanges = commitChanges;
exports.pushChanges = pushChanges;
exports.hasConflicts = hasConflicts;
exports.getWorktreeDiff = getWorktreeDiff;
exports.executeMerge = executeMerge;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function runGit(args) {
    try {
        const output = (0, node_child_process_1.execSync)(`git ${args}`, { encoding: 'utf-8', stdio: 'pipe' });
        return { success: true, output: output.trim() };
    }
    catch (e) {
        const err = e;
        return { success: false, output: '', error: err.stderr?.trim() ?? err.message ?? 'Unknown error' };
    }
}
function isGitRepo() {
    return (0, node_fs_1.existsSync)('.git');
}
function getCurrentBranch() {
    return (0, node_child_process_1.execSync)('git branch --show-current', { encoding: 'utf-8' }).trim();
}
function createWorktree(batchId, baseDir, sourceBranch) {
    const worktreePath = (0, node_path_1.join)(baseDir, batchId);
    if ((0, node_fs_1.existsSync)(worktreePath)) {
        (0, node_fs_1.rmSync)(worktreePath, { recursive: true, force: true });
    }
    const branch = sourceBranch ?? getCurrentBranch();
    return runGit(`worktree add "${worktreePath}" "${branch}"`);
}
function removeWorktree(batchId, baseDir) {
    const worktreePath = (0, node_path_1.join)(baseDir, batchId);
    const r = runGit(`worktree remove "${worktreePath}" --force`);
    if ((0, node_fs_1.existsSync)(worktreePath)) {
        (0, node_fs_1.rmSync)(worktreePath, { recursive: true, force: true });
    }
    return r;
}
function cleanWorktrees(baseDir) {
    if ((0, node_fs_1.existsSync)(baseDir)) {
        (0, node_fs_1.rmSync)(baseDir, { recursive: true, force: true });
    }
}
function mergeWorktree(batchId, baseDir) {
    const worktreePath = (0, node_path_1.join)(baseDir, batchId);
    return runGit(`merge "${worktreePath}" --no-ff -m "merge: batch ${batchId}"`);
}
function commitChanges(message) {
    return runGit(`commit -am "${message}"`);
}
function pushChanges() {
    return runGit('push');
}
function hasConflicts() {
    const r = runGit('status --porcelain');
    return r.output.includes('UU ') || r.output.includes('AA ');
}
function getWorktreeDiff(batchId, baseDir) {
    const worktreePath = (0, node_path_1.join)(baseDir, batchId);
    try {
        return (0, node_child_process_1.execSync)(`git -C "${worktreePath}" diff HEAD`, { encoding: 'utf-8' });
    }
    catch {
        return '(unable to read diff)';
    }
}
function executeMerge(worktreesDir, batchIds, commitMessage) {
    for (const batchId of batchIds) {
        const result = mergeWorktree(batchId, worktreesDir);
        if (!result.success) {
            if (hasConflicts()) {
                return {
                    success: false,
                    output: '',
                    error: `Merge conflict in batch "${batchId}".\n${result.error}\n\nManual intervention required.`,
                };
            }
            return result;
        }
    }
    const commitR = commitChanges(commitMessage);
    if (!commitR.success) {
        if (!commitR.error?.includes('nothing to commit')) {
            return commitR;
        }
    }
    return pushChanges();
}
