import { ROUTES, ROUTE_SELECTORS, UNAUTH_REDIRECT_ROUTES } from '../config.mjs';
import { assertRedirectToLogin, assertRouteMatch, assertSelectorExists } from '../assertions.mjs';

export const suiteId = 'notice.flow';
export const suiteDescription = 'Notice list and detail fallback behavior';

export function createCases(ctx) {
  return [
    {
      caseName: 'notices-page-loads',
      run: async () => {
        if (!ctx.token) {
          await ctx.clearToken();
          const { currentPath } = await ctx.reLaunchRoute(ROUTES.notices, ctx.waitMs + 600);

          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: 'Notices route fallback without token'
          });
          return;
        }

        await ctx.setToken(ctx.token);
        const { page, expectedRoute, currentPath } = await ctx.reLaunchRoute(ROUTES.notices);

        assertRouteMatch({
          expectedRoute,
          currentPath,
          tokenPresent: true,
          label: 'Notices route'
        });

        await assertSelectorExists({
          page,
          selector: ROUTE_SELECTORS[ROUTES.notices],
          strict: ctx.strictSelector,
          label: 'Notices root selector'
        });
      }
    },
    {
      caseName: 'notice-detail-without-id-falls-back-to-list',
      run: async () => {
        if (!ctx.token) {
          await ctx.clearToken();
          const { currentPath } = await ctx.reLaunchRoute(ROUTES.noticeDetail, ctx.waitMs + 600);

          assertRedirectToLogin({
            loginRoute: ROUTES.login,
            fallbackRoutes: UNAUTH_REDIRECT_ROUTES.filter((candidate) => candidate !== ROUTES.login),
            currentPath,
            label: 'Notice detail fallback without token'
          });
          return;
        }

        await ctx.setToken(ctx.token);
        const { currentPath } = await ctx.reLaunchRoute(ROUTES.noticeDetail, ctx.waitMs + 600);

        assertRouteMatch({
          expectedRoute: ROUTES.notices,
          currentPath,
          tokenPresent: true,
          label: 'Notice detail fallback route'
        });
      }
    }
  ];
}
