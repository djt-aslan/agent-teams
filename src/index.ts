#!/usr/bin/env node
import { existsSync, rmSync } from 'node:fs';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';

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

program.parse(process.argv);
