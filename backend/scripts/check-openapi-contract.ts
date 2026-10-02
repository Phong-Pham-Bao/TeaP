import { spawnSync } from 'child_process';
import { readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(__dirname, '..');
const specPath = path.join(backendRoot, 'openapi', 'openapi.json');
const generatedTypesPath = path.resolve(
  backendRoot,
  '..',
  'frontend',
  'src',
  'lib',
  'api-contract.generated.ts',
);

function runNode(script: string, args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: backendRoot,
    env: process.env,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `${script} failed with exit ${result.status}\n${result.stdout}\n${result.stderr}`,
    );
  }
}

async function main() {
  runNode(require.resolve('ts-node/dist/bin.js'), [
    'scripts/generate-openapi.ts',
    '--check',
  ]);

  const temporaryTypesPath = path.join(
    tmpdir(),
    `teap-api-contract-${randomUUID()}.ts`,
  );
  try {
    runNode(
      path.join(
        backendRoot,
        'node_modules',
        'openapi-typescript',
        'bin',
        'cli.js',
      ),
      [
      path.relative(backendRoot, specPath),
      '-o',
      temporaryTypesPath,
      ],
    );
    const [expected, actual] = await Promise.all([
      readFile(temporaryTypesPath, 'utf8'),
      readFile(generatedTypesPath, 'utf8'),
    ]);
    if (expected !== actual) {
      throw new Error(
        'Generated frontend API types are stale. Run openapi:generate and commit the result.',
      );
    }
    console.log('OpenAPI specification and frontend API types are current');
  } finally {
    await rm(temporaryTypesPath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
