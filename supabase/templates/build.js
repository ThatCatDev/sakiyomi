#!/usr/bin/env node
/**
 * Build script to compile MJML email templates to HTML
 * Run: bun supabase/templates/build.js
 */

import mjml2html from 'mjml';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

const SRC_DIR = join(import.meta.dirname, 'src');
const OUT_DIR = import.meta.dirname;
const PUBLIC_DIR = join(import.meta.dirname, '../../public/email');

async function build() {
  console.log('Building email templates...\n');

  // Ensure public/email directory exists
  await mkdir(PUBLIC_DIR, { recursive: true });

  const files = await readdir(SRC_DIR);
  const mjmlFiles = files.filter(f => f.endsWith('.mjml'));

  for (const file of mjmlFiles) {
    const inputPath = join(SRC_DIR, file);
    const outputName = basename(file, '.mjml') + '.html';
    const outputPath = join(OUT_DIR, outputName);
    const publicPath = join(PUBLIC_DIR, outputName);

    const mjmlContent = await readFile(inputPath, 'utf-8');
    const result = mjml2html(mjmlContent, {
      validationLevel: 'soft'
    });

    if (result.errors.length > 0) {
      console.warn(`Warnings for ${file}:`);
      result.errors.forEach(e => console.warn(`  - ${e.message}`));
    }

    await writeFile(outputPath, result.html);
    await writeFile(publicPath, result.html);
    console.log(`✓ ${file} → ${outputName}`);
  }

  console.log('\nDone! Templates compiled to supabase/templates/ and public/email/');
}

build().catch(console.error);
