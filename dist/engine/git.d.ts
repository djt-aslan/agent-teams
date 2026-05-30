export interface GitResult {
    success: boolean;
    output: string;
    error?: string;
}
export declare function isGitRepo(): boolean;
export declare function getCurrentBranch(): string;
export declare function createWorktree(batchId: string, baseDir: string, sourceBranch?: string): GitResult;
export declare function removeWorktree(batchId: string, baseDir: string): GitResult;
export declare function cleanWorktrees(baseDir: string): void;
export declare function mergeWorktree(batchId: string, baseDir: string): GitResult;
export declare function commitChanges(message: string): GitResult;
export declare function pushChanges(): GitResult;
export declare function hasConflicts(): boolean;
export declare function getWorktreeDiff(batchId: string, baseDir: string): string;
export declare function executeMerge(worktreesDir: string, batchIds: string[], commitMessage: string): GitResult;
