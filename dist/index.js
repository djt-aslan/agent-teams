#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const commander_1 = require("commander");
const init_js_1 = require("./commands/init.js");
const start_js_1 = require("./commands/start.js");
const status_js_1 = require("./commands/status.js");
const next_js_1 = require("./commands/next.js");
const approve_js_1 = require("./commands/approve.js");
const artifact_js_1 = require("./commands/artifact.js");
const report_js_1 = require("./commands/report.js");
const list_js_1 = require("./commands/list.js");
const program = new commander_1.Command();
program
    .name('agent-teams')
    .description('AI Agent Teams for end-to-end software delivery')
    .version('0.1.0');
program
    .command('init')
    .description('Initialize Agent Teams in the current workspace')
    .option('--clean', 'Overwrite existing .agent-teams/')
    .action((options) => {
    if (options.clean && (0, node_fs_1.existsSync)('.agent-teams')) {
        (0, node_fs_1.rmSync)('.agent-teams', { recursive: true, force: true });
    }
    (0, init_js_1.initCommand)();
});
program
    .command('start [requirement]')
    .description('Start a new pipeline')
    .option('--spec <path>', 'Load requirements from file')
    .option('--clean', 'Clear previous state')
    .action((requirement, options) => {
    (0, start_js_1.startCommand)(requirement ?? '', options);
});
program
    .command('status')
    .description('Show pipeline status')
    .action(() => (0, status_js_1.statusCommand)());
program
    .command('next')
    .description('Advance to the next stage')
    .action(() => (0, next_js_1.nextCommand)());
program
    .command('approve <stage>')
    .description('Approve a stage after human review')
    .action((stage) => (0, approve_js_1.approveCommand)(stage));
program
    .command('reject <stage>')
    .description('Reject a stage and retry')
    .option('--reason <reason>', 'Reason for rejection')
    .action((stage, options) => (0, approve_js_1.rejectCommand)(stage, options.reason));
program
    .command('retry <stage>')
    .description('Retry a failed stage')
    .action((stage) => (0, approve_js_1.retryCommand)(stage));
program
    .command('artifact <stage>')
    .description('Show artifact for a stage')
    .action((stage) => (0, artifact_js_1.artifactCommand)(stage));
program
    .command('report')
    .description('Show pipeline summary')
    .action(() => (0, report_js_1.reportCommand)());
program
    .command('list <resource>')
    .description('List agents, skills, or standards')
    .action((resource) => {
    if (!['agents', 'skills', 'standards'].includes(resource)) {
        console.error('Resource must be: agents, skills, or standards');
        return;
    }
    (0, list_js_1.listCommand)(resource);
});
program.parse(process.argv);
