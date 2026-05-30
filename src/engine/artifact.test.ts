import { describe, it, expect, afterEach } from 'vitest';
import { parseFrontmatter, validateArtifact, getReviewVerdict } from './artifact.js';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';

describe('parseFrontmatter', () => {
  const testFile = '.test-artifact.md';

  afterEach(() => {
    if (existsSync(testFile)) unlinkSync(testFile);
  });

  it('should parse valid frontmatter', () => {
    writeFileSync(testFile, '---\nstage: prd\nstatus: completed\nsummary: done\n---\n\n# Content');
    const fm = parseFrontmatter(testFile);
    expect(fm.stage).toBe('prd');
    expect(fm.status).toBe('completed');
    expect(fm.summary).toBe('done');
  });

  it('should parse CRLF frontmatter', () => {
    writeFileSync(testFile, '---\r\nstage: prd\r\nstatus: completed\r\n---\r\n\r\n# Content');
    const fm = parseFrontmatter(testFile);
    expect(fm.stage).toBe('prd');
  });

  it('should throw when no frontmatter', () => {
    writeFileSync(testFile, '# No frontmatter here');
    expect(() => parseFrontmatter(testFile)).toThrow('No frontmatter found');
  });

  it('should parse verdict in frontmatter', () => {
    writeFileSync(testFile, '---\nstage: review\nverdict: pass\nissues: []\n---\n');
    const fm = parseFrontmatter(testFile);
    expect(fm.verdict).toBe('pass');
    expect(fm.issues).toEqual([]);
  });
});

describe('validateArtifact', () => {
  const testFile = '.test-validate.md';

  afterEach(() => {
    if (existsSync(testFile)) unlinkSync(testFile);
  });

  it('should pass valid artifact', () => {
    writeFileSync(testFile, '---\nstage: prd\nstatus: completed\n---\n\n# OK');
    const result = validateArtifact(testFile);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should fail missing stage', () => {
    writeFileSync(testFile, '---\nstatus: completed\n---\n\n# Missing stage');
    const result = validateArtifact(testFile);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('getReviewVerdict', () => {
  const testFile = '.test-verdict.md';

  afterEach(() => {
    if (existsSync(testFile)) unlinkSync(testFile);
  });

  it('should return pass verdict', () => {
    writeFileSync(testFile, '---\nstage: prd\nstatus: completed\nverdict: pass\n---\n');
    expect(getReviewVerdict(testFile)).toBe('pass');
  });

  it('should return null when no verdict', () => {
    writeFileSync(testFile, '---\nstage: prd\nstatus: completed\n---\n');
    expect(getReviewVerdict(testFile)).toBeNull();
  });
});
