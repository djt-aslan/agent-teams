"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkerDispatch = generateWorkerDispatch;
exports.generateReviewDispatch = generateReviewDispatch;
exports.formatDispatchForAI = formatDispatchForAI;
const BASE = '.agent-teams';
function generateWorkerDispatch(config, state, requirement) {
    const artifacts = [];
    if (config.depends_on) {
        for (const dep of config.depends_on) {
            const depStage = state.artifacts[dep];
            if (depStage)
                artifacts.push(`${BASE}/${depStage}`);
        }
    }
    return {
        task: config.stage,
        agent: config.agent,
        skill: config.skill,
        output: `${BASE}/${config.output}`,
        context: {
            requirement,
            artifacts,
            stage: config.stage,
        },
    };
}
function generateReviewDispatch(config, state, batchId) {
    let artifactPath = `${BASE}/${config.output}`;
    if (batchId) {
        artifactPath = `${BASE}/artifacts/implementation/${batchId}-report.md`;
    }
    return {
        task: 'review',
        agent: config.reviewer.agent,
        skill: config.reviewer.skill,
        output: `${BASE}/artifacts/review-reports/${config.stage}${batchId ? '-' + batchId : ''}-review.md`,
        context: {
            artifacts: [artifactPath],
            stage: config.stage,
        },
        target: {
            stage: config.stage,
            artifact: artifactPath,
        },
    };
}
function formatDispatchForAI(instruction) {
    const lines = [];
    lines.push(`## Dispatch: ${instruction.task.toUpperCase()}`);
    lines.push('');
    lines.push(`**Agent:** ${instruction.agent}`);
    lines.push(`**Skill:** ${instruction.skill}`);
    lines.push(`**Output:** ${instruction.output}`);
    lines.push('');
    if (instruction.context.artifacts.length > 0) {
        lines.push('**Context artifacts (read as needed):**');
        for (const a of instruction.context.artifacts) {
            lines.push(`- ${a}`);
        }
        lines.push('');
    }
    if (instruction.context.requirement) {
        lines.push(`**User requirement:** ${instruction.context.requirement}`);
        lines.push('');
    }
    if (instruction.target) {
        lines.push(`**Review target:** ${instruction.target.artifact}`);
        lines.push('');
    }
    lines.push('---');
    return lines.join('\n');
}
