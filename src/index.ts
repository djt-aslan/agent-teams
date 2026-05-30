#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('agent-teams')
  .description('AI Agent Teams for end-to-end software delivery')
  .version('0.1.0');

program.parse(process.argv);
