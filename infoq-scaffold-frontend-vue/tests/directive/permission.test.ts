import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import { hasPermi, hasRoles } from '@/directive/permission';

const mountTarget = () => {
  const parent = document.createElement('div');
  const el = document.createElement('button');
  parent.appendChild(el);
  return { parent, el };
};

describe('directive/permission', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('removes element when permission mismatch', () => {
    const userStore = useUserStore();
    userStore.permissions = ['system:user:list'];

    const { parent, el } = mountTarget();
    hasPermi.mounted?.(el, { value: ['system:user:add'] } as any);

    expect(parent.children.length).toBe(0);
  });

  it('keeps element when permission match', () => {
    const userStore = useUserStore();
    userStore.permissions = ['*:*:*'];

    const { parent, el } = mountTarget();
    hasPermi.mounted?.(el, { value: ['system:user:add'] } as any);

    expect(parent.children.length).toBe(1);
  });

  it('throws when directive value is invalid', () => {
    const { el } = mountTarget();
    expect(() => hasPermi.mounted?.(el, { value: undefined } as any)).toThrow(/check perms/i);
  });

  it('removes element when role mismatch', () => {
    const userStore = useUserStore();
    userStore.roles = ['guest'];

    const { parent, el } = mountTarget();
    hasRoles.mounted?.(el, { value: ['admin'] } as any);

    expect(parent.children.length).toBe(0);
  });

  it('keeps element when role matched', () => {
    const userStore = useUserStore();
    userStore.roles = ['admin'];

    const { parent, el } = mountTarget();
    hasRoles.mounted?.(el, { value: ['editor'] } as any);

    expect(parent.children.length).toBe(1);
  });
});
