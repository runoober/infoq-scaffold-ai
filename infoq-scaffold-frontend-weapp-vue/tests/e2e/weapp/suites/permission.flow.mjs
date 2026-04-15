import { PROTECTED_ROUTES, ROUTES, ROUTE_SELECTORS, UNAUTH_REDIRECT_ROUTES } from '../config.mjs';
import { assertRedirectToLogin, assertRouteMatch, assertSelectorExists } from '../assertions.mjs';

export const suiteId = 'permission.flow';
export const suiteDescription = 'Permission and route-guard checks';

export function createCases(ctx) {
  return [
    {
      caseName: 'protected-routes-redirect-login-without-token',
      run: async () => {
        await ctx.clearToken();

        for (const protectedRoute of PROTECTED_ROUTES) {
          const { currentPath } = await ctx.reLaunchRoute(protectedRoute, ctx.waitMs + 600);
          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: `Permission guard for ${protectedRoute}`
          });
        }
      }
    },
    {
      caseName: 'system-users-route-loads-with-token',
      run: async () => {
        if (!ctx.token) {
          await ctx.clearToken();
          const { currentPath } = await ctx.reLaunchRoute(ROUTES.systemUsers, ctx.waitMs + 600);

          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: 'System users fallback without token'
          });
          return;
        }

        await ctx.setToken(ctx.token);
        const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(ROUTES.systemUsers);

        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: true,
          label: 'System users route'
        });

        await assertSelectorExists({
          page,
          selector: ROUTE_SELECTORS[ROUTES.systemUsers],
          strict: ctx.strictSelector,
          label: 'System users root selector'
        });
      }
    }
  ];
}
