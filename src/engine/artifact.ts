import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { ArtifactFrontmatter, ReviewVerdict } from '../types.js';

export function parseFrontmatter(filePath: string): ArtifactFrontmatter {
  const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }
  return parseYaml(match[1]) as ArtifactFrontmatter;
}

export function validateArtifact(filePath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  try {
    const fm = parseFrontmatter(filePath);
    if (!fm.stage) errors.push('Missing "stage" field');
    if (!fm.status) errors.push('Missing "status" field');
  } catch (e) {
    errors.push(`Frontmatter parse error: ${(e as Error).message}`);
  }
  return { valid: errors.length === 0, errors };
}

export function getReviewVerdict(filePath: string): ReviewVerdict | null {
  const fm = parseFrontmatter(filePath);
  return fm.verdict ?? null;
}

export function getArtifactSummary(filePath: string): string {
  const fm = parseFrontmatter(filePath);
  return fm.summary ?? '(no summary)';
}

export function readArtifactContent(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}
