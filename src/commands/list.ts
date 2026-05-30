import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function listCommand(resource: string): void {
  const basePath = join('.agent-teams');
  const resourcePath = join(basePath, resource);

  if (!existsSync(resourcePath)) {
    console.error(`No "${resource}" directory found in .agent-teams/`);
    return;
  }

  console.log(`\n${resource.toUpperCase()}:`);
  console.log('='.repeat(40));

  if (resource === 'standards') {
    listRecursive(resourcePath, '');
  } else {
    for (const file of readdirSync(resourcePath)) {
      if (file.endsWith('.md') || file.endsWith('.yaml')) {
        console.log(`  ${file.replace('.md', '').replace('.yaml', '')}`);
      }
    }
  }
  console.log('');
}

function listRecursive(dir: string, prefix: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      console.log(`  ${prefix}${entry}/`);
      listRecursive(full, prefix + '  ');
    } else if (entry.endsWith('.md')) {
      console.log(`  ${prefix}${entry.replace('.md', '')}`);
    }
  }
}
