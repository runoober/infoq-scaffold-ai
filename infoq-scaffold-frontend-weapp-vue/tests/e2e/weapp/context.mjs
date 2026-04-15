import assert from 'node:assert/strict';

export function normalizeRoute(route) {
  const trimmed = String(route || '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function stripLeadingSlash(route) {
  return normalizeRoute(route).replace(/^\//, '');
}

export function dedupeRoutes(routeList) {
  const seen = new Set();
  const result = [];

  for (const route of routeList) {
    const normalized = normalizeRoute(route);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function createE2EContext({ miniProgram, waitMs, token, extraRoutes, strictSelector, reactMounted, keepExistingSession }) {
  const preserveSession = Boolean(keepExistingSession);

  return {
    miniProgram,
    waitMs,
    token,
    extraRoutes,
    strictSelector,
    reactMounted,
    keepExistingSession: preserveSession,
    clearToken: async () => {
      if (preserveSession) {
        return;
      }
      await miniProgram.callWxMethod('removeStorageSync', 'Admin-Token');
    },
    setToken: async (value) => {
      if (preserveSession) {
        return;
      }
      await miniProgram.callWxMethod('setStorageSync', 'Admin-Token', value);
    },
    reLaunchRoute: async (route, customWaitMs) => {
      const expectedRoute = normalizeRoute(route);
      const launchedPage = await miniProgram.reLaunch(expectedRoute);
      assert(launchedPage, `Unable to launch route "${expectedRoute}".`);

      await launchedPage.waitFor(customWaitMs || waitMs);

      const currentPage = await miniProgram.currentPage();
      assert(currentPage, `No current page after route "${expectedRoute}".`);

      return {
        page: currentPage,
        launchedPage,
        expectedRoute,
        currentPath: normalizeRoute(currentPage.path || '')
      };
    }
  };
}
