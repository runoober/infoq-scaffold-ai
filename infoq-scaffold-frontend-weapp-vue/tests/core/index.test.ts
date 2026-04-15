import { describe, expect, it } from 'vitest';
import * as mobileCore from '../../src/api';

describe('api index exports', () => {
  it('should expose key runtime helpers and api functions', () => {
    expect(typeof mobileCore.request).toBe('function');
    expect(typeof mobileCore.getToken).toBe('function');
    expect(typeof mobileCore.login).toBe('function');
    expect(typeof mobileCore.listUser).toBe('function');
    expect(typeof mobileCore.loadWorkbenchSummary).toBe('function');
  });
});
