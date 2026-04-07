import { ALL_PERMISSION, hasPermission, normalizePermissions } from '../../src/mobile-core/permissions';

describe('mobile-core/permissions', () => {
  it('normalizePermissions should keep raw permissions when no wildcard', () => {
    const permissions = ['system:user:list'];
    const normalized = normalizePermissions(permissions);

    expect(normalized).toBe(permissions);
    expect(normalized).toEqual(['system:user:list']);
  });

  it('normalizePermissions should expand fallback permissions for wildcard', () => {
    const normalized = normalizePermissions([ALL_PERMISSION]);

    expect(normalized).toContain(ALL_PERMISSION);
    expect(normalized).toContain('system:notice:query');
    expect(normalized).toContain('monitor:operLog:remove');
    expect(new Set(normalized).size).toBe(normalized.length);
  });

  it('hasPermission should support wildcard and explicit permission', () => {
    expect(hasPermission([ALL_PERMISSION], 'system:role:list')).toBe(true);
    expect(hasPermission(['system:user:list'], 'system:user:list')).toBe(true);
    expect(hasPermission(['system:user:list'], 'system:role:list')).toBe(false);
  });
});
