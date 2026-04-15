import { ROUTES, ROUTE_SELECTORS, UNAUTH_REDIRECT_ROUTES } from '../config.mjs';
import { assertRedirectToLogin, assertRouteMatch, assertSelectorExists } from '../assertions.mjs';

export const suiteId = 'auth.flow';
export const suiteDescription = 'Authentication guard checks';

export function createCases(ctx) {
  return [
    {
      caseName: 'unauthenticated-home-redirects-login',
      run: async () => {
        await ctx.clearToken();
        const { currentPath } = await ctx.reLaunchRoute(ROUTES.home, ctx.waitMs + 600);

        assertRedirectToLogin({
          loginRoute: ROUTES.login,
          fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
          currentPath,
          label: 'Auth unauthenticated home redirect'
        });
      }
    },
    {
      caseName: 'authenticated-home-stays-home',
      run: async () => {
        if (!ctx.token) {
          await ctx.clearToken();
          const { currentPath } = await ctx.reLaunchRoute(ROUTES.home, ctx.waitMs + 600);

          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: 'Auth authenticated-home case fallback without token'
          });
          return;
        }

        await ctx.setToken(ctx.token);
        const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(ROUTES.home);

        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: true,
          label: 'Auth authenticated home route'
        });

        await assertSelectorExists({
          page,
          selector: ROUTE_SELECTORS[ROUTES.home],
          strict: ctx.strictSelector,
          label: 'Auth authenticated home selector'
        });
      }
    }
  ];
}
