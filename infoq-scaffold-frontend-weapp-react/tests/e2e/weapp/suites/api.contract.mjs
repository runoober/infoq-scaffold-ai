import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const API_ROOT = path.resolve(process.cwd(), 'src/api');

export const suiteId = 'api.contract';
export const suiteDescription = 'API contract smoke to ensure all project api wrappers are covered';

export function createCases() {
  const inventory = collectApiInventory();

  return [
    {
      caseName: `api-files:${inventory.files.length}`,
      run: async () => {
        assert(inventory.files.length > 0, `No API files found under ${API_ROOT}`);
        assert(inventory.items.length > 0, 'No API wrapper exports were detected.');
      }
    },
    ...inventory.items.map((item) => ({
      caseName: `api-contract:${item.file}#${item.name}`,
      run: async () => {
        assert(item.transport === 'request' || item.transport === 'uploadFile', `Unsupported transport in ${item.file}#${item.name}`);
        assert(item.method.length > 0, `Missing method for ${item.file}#${item.name}`);
        assert(item.url.length > 0, `Missing url for ${item.file}#${item.name}`);
      }
    }))
  ];
}

function collectApiInventory() {
  const files = walkApiFiles(API_ROOT).sort();
  const items = files.flatMap((file) => parseApiExports(file));

  const duplicateKeySet = new Set();
  for (const item of items) {
    const key = `${item.file}#${item.name}`;
    assert(!duplicateKeySet.has(key), `Duplicate API export detected: ${key}`);
    duplicateKeySet.add(key);
  }

  return {
    files,
    items
  };
}

function walkApiFiles(rootDir) {
  const entries = readdirSync(rootDir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkApiFiles(fullPath));
      continue;
    }

    if (entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseApiExports(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const exportRegex = /export const (\w+)\s*=\s*\(/g;
  const exports = [];
  let matched = exportRegex.exec(content);

  while (matched) {
    exports.push({
      name: matched[1],
      start: matched.index
    });
    matched = exportRegex.exec(content);
  }

  assert(exports.length > 0, `No exported API wrappers detected in ${filePath}`);

  return exports.map((item, index) => {
    const nextStart = index + 1 < exports.length ? exports[index + 1].start : content.length;
    const block = content.slice(item.start, nextStart);

    const methodMatch = block.match(/method:\s*'([A-Z]+)'/);
    const urlMatch = block.match(/url:\s*([^,\n]+)/);
    const transportMatch = block.match(/\b(request|uploadFile)\s*</) || block.match(/\b(request|uploadFile)\s*\(/);

    assert(urlMatch, `No url found in ${filePath} export ${item.name}`);
    assert(transportMatch, `No request/uploadFile invocation found in ${filePath} export ${item.name}`);

    const transport = transportMatch[1];
    if (transport === 'request') {
      assert(methodMatch, `No method found in ${filePath} export ${item.name}`);
    }

    return {
      file: path.relative(process.cwd(), filePath),
      name: item.name,
      method: methodMatch ? methodMatch[1] : 'UPLOAD',
      url: String(urlMatch[1] || '').trim(),
      transport
    };
  });
}
