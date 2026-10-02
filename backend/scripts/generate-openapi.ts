import { NestFactory } from '@nestjs/core';
import { writeFile, mkdir, readFile } from 'fs/promises';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/openapi';

const outputPath = path.resolve(__dirname, '..', 'openapi', 'openapi.json');

async function main() {
  process.env.OUTBOX_WORKER_ENABLED = 'false';
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  try {
    const document = createOpenApiDocument(app);
    const nextContent = `${JSON.stringify(document, null, 2)}\n`;

    if (process.argv.includes('--check')) {
      const currentContent = await readFile(outputPath, 'utf8').catch(() => '');
      if (currentContent !== nextContent) {
        throw new Error(
          'OpenAPI contract is stale. Run the openapi:generate script and commit the generated files.',
        );
      }
      console.log(`OpenAPI contract is current: ${outputPath}`);
      return;
    }

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, nextContent, 'utf8');
    console.log(`OpenAPI contract written: ${outputPath}`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
