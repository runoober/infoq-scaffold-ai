import { ROUTES, ROUTE_SELECTORS } from '../config.mjs';
import { assertRouteMatch, assertSelectorExists } from '../assertions.mjs';
import { dedupeRoutes, stripLeadingSlash } from '../context.mjs';

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
      let selectorRoute = expectedRoute;
      if (route === ROUTES.login && ctx.token) {
        const isLoginRoute = stripLeadingSlash(currentPath) === stripLeadingSlash(ROUTES.login);
        const isHomeRoute = stripLeadingSlash(currentPath) === stripLeadingSlash(ROUTES.home);
        if (!isLoginRoute && !isHomeRoute) {
          throw new Error(
            `Smoke route ${route} expected "${ROUTES.login}" or authenticated redirect "${ROUTES.home}", but actual route is "${currentPath}".`
          );
        }
        if (isHomeRoute) {
          selectorRoute = ROUTES.home;
        }
      } else {
        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: Boolean(ctx.token),
          label: `Smoke route ${route}`
        });
      }

      const selector = ROUTE_SELECTORS[selectorRoute];
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
