#!/usr/bin/env node
import { existsSync, rmSync } from 'node:fs';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { nextCommand } from './commands/next.js';
import { approveCommand, rejectCommand, retryCommand } from './commands/approve.js';

const program = new Command();

program
  .name('agent-teams')
  .description('AI Agent Teams for end-to-end software delivery')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Agent Teams in the current workspace')
  .option('--clean', 'Overwrite existing .agent-teams/')
  .action((options) => {
    if (options.clean && existsSync('.agent-teams')) {
      rmSync('.agent-teams', { recursive: true, force: true });
    }
    initCommand();
  });

program
  .command('start [requirement]')
  .description('Start a new pipeline')
  .option('--spec <path>', 'Path to requirements spec file')
  .option('--clean', 'Clear previous state')
  .action((requirement, options) => {
    startCommand(requirement ?? '', options);
  });

program
  .command('status')
  .description('Show pipeline status')
  .action(() => statusCommand());

program
  .command('next')
  .description('Advance to the next stage')
  .action(() => nextCommand());

program
  .command('approve <stage>')
  .description('Approve a stage after human review')
  .action((stage) => approveCommand(stage));

program
  .command('reject <stage>')
  .description('Reject a stage and retry')
  .option('--reason <reason>', 'Reason for rejection')
  .action((stage, options) => rejectCommand(stage, options.reason));

program
  .command('retry <stage>')
  .description('Retry a failed stage')
  .action((stage) => retryCommand(stage));

program.parse(process.argv);
