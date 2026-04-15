import assert from 'node:assert/strict';
import { stripLeadingSlash } from './context.mjs';

export function assertRouteMatch({ expectedRoute, currentPath, tokenPresent = false, label = '' }) {
  if (stripLeadingSlash(expectedRoute) === stripLeadingSlash(currentPath)) {
    return;
  }

  if (tokenPresent) {
    throw new Error(
      `${label || 'Route assertion'} expected authenticated route "${expectedRoute}", but actual route is "${currentPath}".`
    );
  }

  throw new Error(`${label || 'Route assertion'} expected route "${expectedRoute}", but actual route is "${currentPath}".`);
}

export function assertRedirectToLogin({ loginRoute, currentPath, label = '', fallbackRoutes = [] }) {
  const expectedRoutes = [loginRoute, ...fallbackRoutes].filter(Boolean);
  if (expectedRoutes.some((route) => stripLeadingSlash(route) === stripLeadingSlash(currentPath))) {
    return;
  }

  throw new Error(
    `${label || 'Login redirect assertion'} expected one of "${expectedRoutes.join(', ')}", but actual route is "${currentPath}".`
  );
}

export async function assertSelectorExists({ page, selector, label = '', strict = false }) {
  const timeoutMs = 4000;
  const pollIntervalMs = 200;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const element = await page.$(selector);
    if (element) {
      return;
    }

    await page.waitFor(pollIntervalMs);
  }

  const message = `${label || 'Selector assertion'} expected selector "${selector}" to exist within ${timeoutMs}ms, but it was not found.`;
  if (strict) {
    assert.fail(message);
  }

  console.warn(`[weapp-e2e] [WARN] ${message}`);
  return false;
}
