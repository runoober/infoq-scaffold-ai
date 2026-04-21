import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pagesDir = resolve(process.cwd(), 'src/pages');

const walkVueFiles = (dirPath: string): string[] => {
  const entries = readdirSync(dirPath);
  const files: string[] = [];
  entries.forEach((entry) => {
    const fullPath = resolve(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walkVueFiles(fullPath));
      return;
    }
    if (fullPath.endsWith('.vue')) {
      files.push(fullPath);
    }
  });
  return files;
};

const extractImportedSymbols = (source: string): Set<string> => {
  const imported = new Set<string>();
  const importMatches = source.matchAll(/import\s*\{([^}]*)\}\s*from/g);
  for (const match of importMatches) {
    const specifiers = match[1].split(',').map((item) => item.trim()).filter(Boolean);
    specifiers.forEach((specifier) => {
      const aliasMatch = specifier.match(/^(.+?)\s+as\s+(.+)$/);
      imported.add((aliasMatch ? aliasMatch[2] : specifier).trim());
    });
  }
  return imported;
};

const extractTemplateHandlers = (source: string): Set<string> => {
  const handlers = new Set<string>();
  const eventMatches = source.matchAll(/@[\w:-]+\s*=\s*"([A-Za-z_][\w]*)\b/g);
  for (const match of eventMatches) {
    if (match[1].startsWith('handle')) {
      handlers.add(match[1]);
    }
  }
  return handlers;
};

const isHandlerDefined = (source: string, handler: string) => {
  const inlineDeclaration = new RegExp(`const\\s+${handler}\\s*=`);
  const functionDeclaration = new RegExp(`function\\s+${handler}\\s*\\(`);
  return inlineDeclaration.test(source) || functionDeclaration.test(source);
};

describe('page template handlers', () => {
  it('should keep every template handle* event bound to local definition or import', () => {
    const vueFiles = walkVueFiles(pagesDir);
    const missing: string[] = [];

    vueFiles.forEach((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      const importedSymbols = extractImportedSymbols(source);
      const handlers = extractTemplateHandlers(source);

      handlers.forEach((handler) => {
        if (!isHandlerDefined(source, handler) && !importedSymbols.has(handler)) {
          missing.push(`${filePath}: ${handler}`);
        }
      });
    });

    expect(missing, missing.join('\n')).toEqual([]);
  });
});
