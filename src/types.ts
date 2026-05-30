export type StageStatus = 'pending' | 'in_progress' | 'review' | 'human_review' | 'passed' | 'failed';

export type ReviewVerdict = 'pass' | 'fail' | 'pass_with_notes';

export interface StageConfig {
  stage: string;
  description: string;
  agent?: string;
  skill?: string;
  engine?: boolean;
  mode?: 'tdd';
  parallel?: boolean;
  worktrees?: string;
  reviewer?: {
    agent: string;
    skill: string;
  };
  depends_on?: string[];
  max_retries?: number;
  output: string;
  review?: boolean;
  gate?: string;
  action?: string;
}

export interface PipelineConfig {
  version: string;
  pipeline: StageConfig[];
}

export interface StageState {
  status: StageStatus;
  started_at?: string;
  completed_at?: string;
  attempt: number;
  review_verdict?: ReviewVerdict;
  batches?: BatchState[];
}

export interface BatchState {
  batch_id: string;
  tasks: string[];
  status: StageStatus;
  worktree?: string;
  output_path?: string;
}

export interface PipelineState {
  pipeline: string;
  current_stage: string;
  stages: Record<string, StageState>;
  started_at: string;
  artifacts: Record<string, string>;
}

export interface DispatchInstruction {
  task: string;
  agent: string;
  skill: string;
  output: string;
  context: {
    requirement?: string;
    artifacts: string[];
    stage: string;
  };
  target?: {
    stage: string;
    artifact: string;
  };
}

export interface ArtifactFrontmatter {
  stage: string;
  batch?: string;
  status: string;
  summary?: string;
  verdict?: ReviewVerdict;
  issues?: string[];
  notes?: string[];
  tasks?: string[];
  tests_passed?: number;
  tests_total?: number;
  diff_summary?: string;
}
