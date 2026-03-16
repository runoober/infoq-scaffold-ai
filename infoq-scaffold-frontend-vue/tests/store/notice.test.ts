import { createPinia, setActivePinia } from 'pinia';
import { useNoticeStore } from '@/store/modules/notice';

describe('store/notice', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds, marks, removes and clears notices', () => {
    const store = useNoticeStore();
    const n1 = { message: 'm1', read: false, time: '2026-01-01 10:00:00' };
    const n2 = { message: 'm2', read: false, time: '2026-01-01 10:01:00' };

    store.addNotice(n1);
    store.addNotice(n2);
    expect(store.state.notices).toHaveLength(2);

    store.readAll();
    expect(store.state.notices.every((n) => n.read)).toBe(true);

    store.removeNotice(n1);
    expect(store.state.notices).toHaveLength(1);
    expect(store.state.notices[0].message).toBe('m2');

    store.clearNotice();
    expect(store.state.notices).toEqual([]);
  });
});
