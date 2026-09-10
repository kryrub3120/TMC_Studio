import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const assetsDir = fileURLToPath(new URL('../apps/web/dist/assets/', import.meta.url));
const productionRef = 'pgacjczecyfnwsaadyvj';
const developmentRef = 'euxauavanukyfofhkrqp';
const files = (await readdir(assetsDir)).filter((file) => file.endsWith('.js'));
const bundles = await Promise.all(files.map((file) => readFile(join(assetsDir, file), 'utf8')));
const output = bundles.join('\n');

if (!output.includes(productionRef)) {
  throw new Error(`Production Supabase project ${productionRef} is missing from the web bundle.`);
}

if (output.includes(developmentRef)) {
  throw new Error(`Development Supabase project ${developmentRef} was found in the production web bundle.`);
}

console.log(`Production bundle verified: Supabase ${productionRef}.`);
