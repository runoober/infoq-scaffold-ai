import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generatedPageBySource, generatedPages, repoBlobBase, sourceDocRoot} from '../site-map.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(projectRoot, '..');
const sourceDocDir = path.join(repoRoot, sourceDocRoot);
const siteDocsDir = path.join(projectRoot, 'docs');
const publicDir = path.join(siteDocsDir, 'public');

const yamlQuote = (value) => `"${String(value).replace(/\\/gu, '\\\\').replace(/"/gu, '\\"')}"`;

const toPosixPath = (value) => value.split(path.sep).join('/');

const routeForSource = (source) => generatedPageBySource.get(source)?.route ?? null;

const repoPathForLink = (pageSource, rawTarget) => {
  const fromDocFile = toPosixPath(path.posix.join(sourceDocRoot, path.posix.dirname(pageSource), rawTarget));
  return path.posix.normalize(fromDocFile);
};

const rewriteMarkdownLinks = (content, page) => {
  return content.replace(/\]\(([^)]+)\)/gu, (fullMatch, rawTarget) => {
    const target = rawTarget.trim();

    if (!target || target.startsWith('#') || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:')) {
      return fullMatch;
    }

    const targetWithoutHash = target.split('#')[0].split('?')[0];
    const targetHash = target.includes('#') ? `#${target.split('#').slice(1).join('#')}` : '';
    const normalizedDocRelative = path.posix.normalize(path.posix.join(path.posix.dirname(page.source), targetWithoutHash));

    if (normalizedDocRelative.endsWith('.md')) {
      const internalRoute = routeForSource(normalizedDocRelative);
      if (internalRoute) {
        return `](${internalRoute}${targetHash})`;
      }
    }

    const repoRelative = repoPathForLink(page.source, targetWithoutHash);

    if (repoRelative.startsWith('doc/examples/')) {
      return `](/examples/${repoRelative.slice('doc/examples/'.length)}${targetHash})`;
    }

    if (repoRelative.startsWith('doc/images/')) {
      return `](/images/${repoRelative.slice('doc/images/'.length)}${targetHash})`;
    }

    return `](${repoBlobBase}/${repoRelative}${targetHash})`;
  });
};

const buildSyncedDocument = (page, content) => {
  const sourceLink = `${repoBlobBase}/${sourceDocRoot}/${page.source}`;
  const preface = [
    '---',
    `title: ${yamlQuote(page.title)}`,
    `description: ${yamlQuote(page.description)}`,
    'outline: [2, 3]',
    '---',
    '',
    '> [!TIP]',
    `> 内容真值源：[\`${sourceDocRoot}/${page.source}\`](${sourceLink})`,
    '> 本页由 `infoq-scaffold-docs/scripts/sync-from-root-doc.mjs` 自动同步生成；请优先修改根 `doc/` 后再重新同步。',
    '',
    ''
  ].join('\n');

  return `${preface}${rewriteMarkdownLinks(content, page)}`;
};

const copyPublicDirectory = async (sourceName, targetName = sourceName) => {
  const sourcePath = path.join(sourceDocDir, sourceName);
  const targetPath = path.join(publicDir, targetName);
  await rm(targetPath, { recursive: true, force: true });
  await mkdir(path.dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
};

const syncPages = async () => {
  for (const page of generatedPages) {
    const sourcePath = path.join(sourceDocDir, page.source);
    const targetPath = path.join(siteDocsDir, page.target);
    const raw = await readFile(sourcePath, 'utf8');
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buildSyncedDocument(page, raw), 'utf8');
  }
};

const main = async () => {
  await mkdir(publicDir, { recursive: true });
  await copyPublicDirectory('images');
  await copyPublicDirectory('examples');
  await syncPages();
  process.stdout.write(`Synced ${generatedPages.length} markdown page(s) from ${sourceDocRoot}/ to infoq-scaffold-docs/docs/.\n`);
};

main().catch((error) => {
  console.error('[docs-sync] Failed to sync root doc content.');
  console.error(error);
  process.exitCode = 1;
});

