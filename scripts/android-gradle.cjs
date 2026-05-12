const { spawnSync } = require('node:child_process');
const path = require('node:path');

const gradleArgs = process.argv.slice(2);
const androidDir = path.resolve(__dirname, '..', 'android');
const isWindows = process.platform === 'win32';

const command = isWindows ? 'gradlew.bat' : 'sh';
const args = isWindows ? gradleArgs : ['./gradlew', ...gradleArgs];

const result = spawnSync(command, args, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWindows,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
