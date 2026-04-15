import { ROUTES, ROUTE_SELECTORS } from '../config.mjs';
import { assertRouteMatch, assertSelectorExists } from '../assertions.mjs';
import { dedupeRoutes } from '../context.mjs';

export const suiteId = 'smoke.routes';
export const suiteDescription = 'Route smoke checks for core entry pages';

export function createCases(ctx) {
  const routes = dedupeRoutes([
    ROUTES.login,
    ...(ctx.token ? [ROUTES.home, ROUTES.profile] : []),
    ...ctx.extraRoutes
  ]);

  return routes.map((route) => ({
    caseName: `route:${route}`,
    run: async () => {
      const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(route);
      assertRouteMatch({
        expectedRoute,
        currentPath,
        tokenPresent: Boolean(ctx.token),
        label: `Smoke route ${route}`
      });

      const selector = ROUTE_SELECTORS[expectedRoute];
      if (selector) {
        await assertSelectorExists({
          page,
          selector,
          strict: ctx.strictSelector,
          label: `Smoke selector ${route}`
        });
      }
    }
  }));
}
