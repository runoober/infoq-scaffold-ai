import { ROUTES, ROUTE_SELECTORS, UNAUTH_REDIRECT_ROUTES } from '../config.mjs';
import { assertRedirectToLogin, assertRouteMatch, assertSelectorExists } from '../assertions.mjs';

export const suiteId = 'profile.flow';
export const suiteDescription = 'Profile and profile-edit pages';

export function createCases(ctx) {
  return [
    {
      caseName: 'profile-page-loads',
      run: async () => {
        if (!ctx.token) {
          await ctx.clearToken();
          const { currentPath } = await ctx.reLaunchRoute(ROUTES.profile, ctx.waitMs + 600);

          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: 'Profile route fallback without token'
          });
          return;
        }

        await ctx.setToken(ctx.token);
        const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(ROUTES.profile);

        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: true,
          label: 'Profile route'
        });

        await assertSelectorExists({
          page,
          selector: ROUTE_SELECTORS[ROUTES.profile],
          strict: ctx.strictSelector,
          label: 'Profile root selector'
        });
      }
    },
    {
      caseName: 'profile-edit-page-loads',
      run: async () => {
        if (!ctx.token) {
          await ctx.clearToken();
          const { currentPath } = await ctx.reLaunchRoute(ROUTES.profileEdit, ctx.waitMs + 600);

          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: 'Profile edit fallback without token'
          });
          return;
        }

        await ctx.setToken(ctx.token);
        const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(ROUTES.profileEdit);

        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: true,
          label: 'Profile edit route'
        });

        await assertSelectorExists({
          page,
          selector: ROUTE_SELECTORS[ROUTES.profileEdit],
          strict: ctx.strictSelector,
          label: 'Profile edit root selector'
        });
      }
    }
  ];
}
