import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'py' : 'python';
const args = process.platform === 'win32' ? ['-3', 'scripts/check_reports.py'] : ['scripts/check_reports.py'];
const result = spawnSync(command, args, { stdio: 'inherit', shell: false });

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
