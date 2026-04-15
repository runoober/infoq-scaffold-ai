import assert from 'node:assert/strict';
import { ALL_ROUTES, ROUTES, ROUTE_SELECTORS, UNAUTH_REDIRECT_ROUTES } from '../config.mjs';
import { assertRedirectToLogin, assertRouteMatch, assertSelectorExists } from '../assertions.mjs';
import { dedupeRoutes } from '../context.mjs';

export const suiteId = 'full.routes';
export const suiteDescription = 'Full route smoke across all registered mini-program pages';

export function createCases(ctx) {
  const routes = dedupeRoutes(ALL_ROUTES);

  return routes.map((route) => ({
    caseName: `full-route:${route}`,
    run: async () => {
      if (route === ROUTES.login) {
        await ctx.clearToken();
        const { expectedRoute, currentPath } = await ctx.reLaunchRoute(route, ctx.waitMs + 600);
        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: false,
          label: `Full route ${route}`
        });
        return;
      }

      if (!ctx.token) {
        await ctx.clearToken();
        const { currentPath } = await ctx.reLaunchRoute(route, ctx.waitMs + 600);
        assertRedirectToLogin({
          loginRoute: ROUTES.login,
          fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
          currentPath,
          label: `Full route unauthenticated guard ${route}`
        });
        return;
      }

      await ctx.setToken(ctx.token);
      const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(route, ctx.waitMs + 600);
      if (expectedRoute === ROUTES.noticeDetail) {
        assert(
          currentPath === expectedRoute || currentPath === ROUTES.notices,
          `Full route ${route} expected "${expectedRoute}" or fallback "${ROUTES.notices}", but actual route is "${currentPath}".`
        );
      } else {
        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: true,
          label: `Full route ${route}`
        });
      }

      const selector = ROUTE_SELECTORS[expectedRoute];
      if (selector) {
        await assertSelectorExists({
          page,
          selector,
          strict: ctx.strictSelector,
          label: `Full route selector ${route}`
        });
      }
    }
  }));
}
