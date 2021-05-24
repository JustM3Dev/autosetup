import fs, { promises as fsp } from 'fs';
import readline from 'readline';
import chalk from 'chalk';

let running = true;
console.log('Starting setup cycle.\n');
console.time(`${chalk.bgMagenta('timer  ')} Finished in `);

function loadSteps (path = 'steps.txt') {
  const lineReader = readline.createInterface({
    input: fs.createReadStream(path)
  });

  lineReader.on('line', (line) => {
    interpretStep(line);
  });
}

function interpretStep (step: string) {
  const checks = [/(create) '(\.?[A-z]{0,})'/g, /(insert into) '(\.?[A-z]{0,})' >? ?'([A-z =_.\\<>"]{0,})'/g]

  for (const check of checks) {
    const exec = check.exec(step);
    if (exec) {
      switch (exec[1]) {
        case 'create':
          console.log(`${chalk.blue('running  ')} ${chalk.cyan(`create '${exec[2]}'`)}`);
          createFile(exec[2]);
          break;
        case 'insert into':
          console.log(`${chalk.blue('running  ')} ${chalk.cyan(`insert into '${exec[2]}' > '${exec[3]}'`)}`);
          insert(exec[2], exec[3]);
          break;
        default:
          console.log(`${chalk.red('error    ')} Command '${exec[2]}' not found.`);
          break;
      }
      return;
    } else console.log(`${chalk.red('error    ')} Command '${step}' not found.`);
  }
}

function createFile (path: string) {
  fsp.writeFile(path, '', { 'flag': 'wx' }).then(() => {
    console.log(`${chalk.green('create  ')}  Created file ${path}!`);
  }).catch((err) => {
    console.log(`${chalk.green('create  ')}  File '${path}' already exists.`);
  });
}

function insert (path: string, content: string) {
  if (!fs.existsSync(path)) { console.log(`${chalk.yellow('insert   ')} File doesn't exist. Create if first!`); return; }

  fsp.writeFile(path, content).then(() => {
    console.log(`${chalk.yellow('insert   ')} Written to file ${path}!`)
  }).catch((err) => console.log(err));
}

// Exit handlers
interface ExitOptions {
  clean?: boolean;
  exit?: boolean;
}

function exitHandler (options: ExitOptions) {
  if (!running) return;
  if (options.exit) { console.log(`${chalk.redBright('exit     ')} Unexpected exit.`); running = false; process.exit(); }

  if (options.clean) {
    console.timeEnd(`${chalk.magenta('timer    ')} Finished in `);
    console.log(`${chalk.redBright('exit     ')} Clean exit.`);
    process.exit();
  }
}

process.on('exit', exitHandler.bind(null, { clean: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

// Start
if (process.argv[2]) {
  console.log(`${chalk.yellowBright('info   ')} Using custom path: ${process.argv[2]}`);
  loadSteps(process.argv[2]);
} else loadSteps();