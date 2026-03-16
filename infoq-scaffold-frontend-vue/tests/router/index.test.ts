import router, { constantRoutes, dynamicRoutes } from '@/router';

describe('router/index', () => {
  it('exposes expected constant and dynamic route definitions', () => {
    const paths = constantRoutes.map((route) => route.path);
    expect(paths).toContain('/login');
    expect(paths).toContain('/register');
    expect(paths).toContain('/401');
    expect(paths).toContain('/redirect');
    expect(dynamicRoutes).toEqual([]);
  });

  it('applies scroll behavior with saved position fallback', () => {
    const scrollBehavior = router.options.scrollBehavior as any;
    const saved = { left: 20, top: 30 };

    expect(scrollBehavior({}, {}, saved)).toEqual(saved);
    expect(scrollBehavior({}, {}, null)).toEqual({ top: 0 });
  });
});
