import { existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function initCommand(): void {
  const targetPath = join(process.cwd(), '.agent-teams');
  const defaultsPath = findDefaultsPath();

  if (existsSync(targetPath)) {
    console.log('.agent-teams/ already exists. Use --clean to overwrite.');
    return;
  }

  mkdirSync(targetPath, { recursive: true });
  copyDir(defaultsPath, targetPath);

  mkdirSync(join(targetPath, 'artifacts'), { recursive: true });
  mkdirSync(join(targetPath, 'artifacts', 'implementation'), { recursive: true });
  mkdirSync(join(targetPath, 'artifacts', 'review-reports'), { recursive: true });
  mkdirSync(join(targetPath, 'worktrees'), { recursive: true });

  // Copy OpenCode commands to project root
  const opencodeSrc = join(findDefaultsPath(), '.opencode');
  if (existsSync(opencodeSrc)) {
    const opencodeDest = join(process.cwd(), '.opencode');
    copyDir(opencodeSrc, opencodeDest);
  }

  console.log(`
Agent Teams initialized!

Created: .agent-teams/
  ├── pipeline.yaml
  ├── agents/        (${countFiles(join(targetPath, 'agents'))} agents)
  ├── skills/        (${countFiles(join(targetPath, 'skills'))} skills)
  ├── standards/     (${countFilesRecursive(join(targetPath, 'standards'))} standards)
  ├── artifacts/
  └── worktrees/

Next: agent-teams start "your requirement description"
`);
}

function findDefaultsPath(): string {
  const candidates = [
    join(__dirname, '..', '..', 'defaults'),
    join(__dirname, '..', 'defaults'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('Cannot find defaults directory');
}

function copyDir(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

function countFiles(dir: string): number {
  return readdirSync(dir).filter(f => statSync(join(dir, f)).isFile()).length;
}

function countFilesRecursive(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      count += countFilesRecursive(full);
    } else {
      count++;
    }
  }
  return count;
}
