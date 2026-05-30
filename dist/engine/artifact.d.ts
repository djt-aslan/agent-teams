import type { ArtifactFrontmatter, ReviewVerdict } from '../types.js';
export declare function parseFrontmatter(filePath: string): ArtifactFrontmatter;
export declare function validateArtifact(filePath: string): {
    valid: boolean;
    errors: string[];
};
export declare function getReviewVerdict(filePath: string): ReviewVerdict | null;
export declare function getArtifactSummary(filePath: string): string;
export declare function readArtifactContent(filePath: string): string;
