#!/usr/bin/env node
import * as program from 'commander';
import { scan } from '../lib/index';
const path = (<any>program.parseArgs)[0] || '.';

program
  .version('0.0.1')
  .command('[path]', '扫描指定 vue 文件目录')
  .action(() => {
    scan(path);
  })
  .parse(process.argv);
