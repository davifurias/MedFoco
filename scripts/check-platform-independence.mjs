#!/usr/bin/env node
// Garante que o código do MedFoco não dependa de APIs internas de plataformas
// (ex.: a API de Artifacts do Claude). Ver AGENTS.md › "Independência de plataforma".
// A pasta legacy/ é ignorada: guarda o HTML original apenas como histórico.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CODE_EXTENSIONS = /\.(c|m)?(j|t)sx?$|\.html?$|\.vue$|\.svelte$/i;
const IGNORED_PREFIXES = ['legacy/', 'node_modules/'];

export const FORBIDDEN_PATTERNS = [
  { pattern: /window\s*\.\s*claude\b/, reason: 'API interna de Artifacts do Claude' },
  { pattern: /\bclaude\s*\.\s*use\s*\(/, reason: 'API interna de Artifacts do Claude' },
];

export function isCheckedFile(path) {
  return CODE_EXTENSIONS.test(path) && !IGNORED_PREFIXES.some((p) => path.startsWith(p));
}

export function findViolations(path, content) {
  const violations = [];
  content.split('\n').forEach((line, index) => {
    for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) violations.push({ path, line: index + 1, reason });
    }
  });
  return violations;
}

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  });
  return output.split('\n').filter(Boolean);
}

function main() {
  const violations = trackedFiles()
    .filter(isCheckedFile)
    .flatMap((path) => findViolations(path, readFileSync(path, 'utf8')));

  if (violations.length) {
    console.error('Dependência de plataforma proibida encontrada:');
    for (const v of violations) console.error(`  ${v.path}:${v.line} — ${v.reason}`);
    process.exit(1);
  }
  console.log('Independência de plataforma: OK');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
