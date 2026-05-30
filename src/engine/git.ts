import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

function runGit(args: string): GitResult {
  try {
    const output = execSync(`git ${args}`, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output: output.trim() };
  } catch (e: any) {
    return { success: false, output: '', error: e.stderr?.trim() ?? e.message };
  }
}

export function isGitRepo(): boolean {
  return existsSync('.git');
}

export function getCurrentBranch(): string {
  return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
}

export function createWorktree(batchId: string, baseDir: string, sourceBranch?: string): GitResult {
  const worktreePath = join(baseDir, batchId);
  if (existsSync(worktreePath)) {
    rmSync(worktreePath, { recursive: true, force: true });
  }
  const branch = sourceBranch ?? getCurrentBranch();
  return runGit(`worktree add "${worktreePath}" "${branch}"`);
}

export function removeWorktree(batchId: string, baseDir: string): GitResult {
  const worktreePath = join(baseDir, batchId);
  const r = runGit(`worktree remove "${worktreePath}" --force`);
  if (existsSync(worktreePath)) {
    rmSync(worktreePath, { recursive: true, force: true });
  }
  return r;
}

export function cleanWorktrees(baseDir: string): void {
  if (existsSync(baseDir)) {
    rmSync(baseDir, { recursive: true, force: true });
  }
}

export function mergeWorktree(batchId: string, baseDir: string): GitResult {
  const worktreePath = join(baseDir, batchId);
  return runGit(`merge "${worktreePath}" --no-ff -m "merge: batch ${batchId}"`);
}

export function commitChanges(message: string): GitResult {
  return runGit(`commit -am "${message}"`);
}

export function pushChanges(): GitResult {
  return runGit('push');
}

export function hasConflicts(): boolean {
  const r = runGit('status --porcelain');
  return r.output.includes('UU ') || r.output.includes('AA ');
}

export function getWorktreeDiff(batchId: string, baseDir: string): string {
  const worktreePath = join(baseDir, batchId);
  try {
    return execSync(`git -C "${worktreePath}" diff HEAD`, { encoding: 'utf-8' });
  } catch {
    return '(unable to read diff)';
  }
}

export function executeMerge(
  worktreesDir: string,
  batchIds: string[],
  commitMessage: string
): GitResult {
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
