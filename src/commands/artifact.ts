import { existsSync, readFileSync } from 'node:fs';
import { loadState } from '../engine/state.js';
import { parseFrontmatter } from '../engine/artifact.js';

export function artifactCommand(stageName: string): void {
  const state = loadState();
  const artifactPath = state.artifacts[stageName];

  if (!artifactPath || !existsSync(artifactPath)) {
    console.error(`No artifact found for stage "${stageName}"`);
    return;
  }

  const fm = parseFrontmatter(artifactPath);
  const content = readFileSync(artifactPath, 'utf-8');

  console.log(`\n=== ${stageName.toUpperCase()} ===`);
  console.log(`Status: ${fm.status}`);
  if (fm.summary) console.log(`Summary: ${fm.summary}`);
  if (fm.verdict) console.log(`Review: ${fm.verdict}`);
  if (fm.issues && fm.issues.length > 0) {
    console.log('Issues:');
    for (const issue of fm.issues) console.log(`  - ${issue}`);
  }
  console.log('\n--- Content ---\n');
  console.log(content);
}
