import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const docsDir = path.join(projectRoot, 'docs');
const publicDir = path.join(docsDir, 'public');

const toPosixPath = (value) => value.split(path.sep).join('/');

const collectMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
};

const routeFromMarkdown = (filePath) => {
  const relative = toPosixPath(path.relative(docsDir, filePath));
  const withoutExt = relative.replace(/\.md$/u, '');
  if (withoutExt === 'index') {
    return '/';
  }
  if (withoutExt.endsWith('/index')) {
    return `/${withoutExt.slice(0, -'/index'.length)}/`;
  }
  return `/${withoutExt}`;
};

const buildKnownRoutes = async () => {
  const markdownFiles = await collectMarkdownFiles(docsDir);
  return new Set(
    markdownFiles.flatMap((file) => {
      const route = routeFromMarkdown(file);
      const normalized = route.endsWith('/') || route === '/' ? route : route;
      const trailing = normalized.endsWith('/') ? normalized.slice(0, -1) || '/' : `${normalized}/`;
      return [normalized, trailing];
    })
  );
};

const pathExists = async (targetPath) => {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
};

const validateLink = async (filePath, target, routes, failures) => {
  const cleaned = target.split('#')[0].split('?')[0];
  if (!cleaned || cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('mailto:')) {
    return;
  }

  if (cleaned.startsWith('/')) {
    if (cleaned.startsWith('/images/') || cleaned.startsWith('/examples/')) {
      const publicTarget = path.join(publicDir, cleaned.slice(1));
      if (!(await pathExists(publicTarget))) {
        failures.push(`${toPosixPath(path.relative(projectRoot, filePath))} -> ${cleaned}`);
      }
      return;
    }

    const normalized = cleaned === '/' ? '/' : cleaned.replace(/\/+$/u, '') || '/';
    const slashVariant = normalized === '/' ? '/' : `${normalized}/`;
    if (!routes.has(normalized) && !routes.has(slashVariant)) {
      failures.push(`${toPosixPath(path.relative(projectRoot, filePath))} -> ${cleaned}`);
    }
    return;
  }

  const resolved = path.resolve(path.dirname(filePath), cleaned);
  if (!(await pathExists(resolved))) {
    failures.push(`${toPosixPath(path.relative(projectRoot, filePath))} -> ${cleaned}`);
  }
};

const main = async () => {
  const files = await collectMarkdownFiles(docsDir);
  const routes = await buildKnownRoutes();
  const failures = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const matches = content.matchAll(/\]\(([^)]+)\)/gu);
    for (const match of matches) {
      await validateLink(filePath, match[1].trim(), routes, failures);
    }
  }

  if (failures.length > 0) {
    console.error('[docs-check-links] Found unresolved links:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write('All markdown links resolved successfully.\n');
};

main().catch((error) => {
  console.error('[docs-check-links] Failed to validate links.');
  console.error(error);
  process.exitCode = 1;
});

