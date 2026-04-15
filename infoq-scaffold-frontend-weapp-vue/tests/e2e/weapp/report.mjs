import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function summarizeResults(results) {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  for (const result of results) {
    if (result.status === 'passed') {
      summary.passed += 1;
    } else if (result.status === 'failed') {
      summary.failed += 1;
    } else {
      summary.skipped += 1;
    }
  }

  return summary;
}

export function writeRunReport({
  suite,
  reportDir,
  startedAt,
  endedAt,
  results,
  consoleLogs = [],
  exceptionLogs = []
}) {
  mkdirSync(reportDir, { recursive: true });

  const summary = summarizeResults(results);
  const timestamp = new Date(endedAt).toISOString().replace(/[:.]/g, '-');
  const baseName = `weapp-e2e-${suite}-${timestamp}`;
  const jsonPath = path.join(reportDir, `${baseName}.json`);
  const markdownPath = path.join(reportDir, `${baseName}.md`);

  const payload = {
    suite,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationMs: endedAt - startedAt,
    summary,
    results,
    console: {
      total: consoleLogs.length + exceptionLogs.length,
      errorLogs: consoleLogs.filter((item) => item.type === 'error').length,
      exceptionLogs: exceptionLogs.length
    },
    consoleLogs,
    exceptionLogs
  };

  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  writeFileSync(markdownPath, toMarkdown(payload), 'utf8');

  return {
    jsonPath,
    markdownPath,
    summary
  };
}

function toMarkdown(payload) {
  const lines = [
    '# WeApp E2E Report',
    '',
    `- suite: ${payload.suite}`,
    `- startedAt: ${payload.startedAt}`,
    `- endedAt: ${payload.endedAt}`,
    `- durationMs: ${payload.durationMs}`,
    `- total: ${payload.summary.total}`,
    `- passed: ${payload.summary.passed}`,
    `- failed: ${payload.summary.failed}`,
    `- skipped: ${payload.summary.skipped}`,
    `- console.total: ${payload.console.total}`,
    `- console.errorLogs: ${payload.console.errorLogs}`,
    `- console.exceptionLogs: ${payload.console.exceptionLogs}`,
    '',
    '| Suite | Case | Status | Duration(ms) | Detail |',
    '| --- | --- | --- | ---: | --- |'
  ];

  for (const result of payload.results) {
    lines.push(
      `| ${escapePipe(result.suiteId)} | ${escapePipe(result.caseName)} | ${result.status} | ${result.durationMs} | ${escapePipe(result.detail || '')} |`
    );
  }

  const consoleIssues = [
    ...payload.consoleLogs
      .filter((item) => item.type === 'error')
      .map((item) => `[console.error] ${item.message}`),
    ...payload.exceptionLogs.map((item) => `[exception] ${item.message}`)
  ];

  if (consoleIssues.length > 0) {
    lines.push('', '## Console Issues', '');
    for (const issue of consoleIssues.slice(0, 50)) {
      lines.push(`- ${escapePipe(issue)}`);
    }
    if (consoleIssues.length > 50) {
      lines.push(`- ... ${consoleIssues.length - 50} more issue(s)`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function escapePipe(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
}
