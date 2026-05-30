"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFixerDispatch = generateFixerDispatch;
exports.formatFixerForAI = formatFixerForAI;
const dispatch_js_1 = require("./dispatch.js");
const DEFAULT_FIXER = {
    agent: 'agents/reviewer.md',
    skill: 'skills/code-review.md',
};
function generateFixerDispatch(error, context, fixerConfig = DEFAULT_FIXER) {
    return {
        task: 'fix',
        agent: fixerConfig.agent,
        skill: fixerConfig.skill,
        output: '(no output - fix only)',
        context: {
            artifacts: [],
            stage: 'error-recovery',
            requirement: `The following operation failed: ${context}\n\nError:\n\`\`\`\n${error.message}\n\`\`\`\n\nPlease diagnose and fix this issue. Then instruct the user to resume by running "agent-teams next".`,
        },
    };
}
function formatFixerForAI(instruction) {
    return `## ERROR RECOVERY\n\n${(0, dispatch_js_1.formatDispatchForAI)(instruction)}\n\nAfter fixing, tell the user to run "agent-teams next" to continue.`;
}
