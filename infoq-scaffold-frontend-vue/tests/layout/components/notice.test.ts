import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, reactive } from 'vue';
import NoticePanel from '@/layout/components/notice/index.vue';

const noticePanelMocks = vi.hoisted(() => ({
  readAll: vi.fn(),
  store: {
    state: {
      notices: [] as Array<{ message: string; time: string; read: boolean }>
    },
    readAll: vi.fn()
  }
}));

vi.mock('@/store/modules/notice', () => ({
  useNoticeStore: () => noticePanelMocks.store
}));

const ElEmptyStub = defineComponent({
  name: 'ElEmpty',
  props: {
    description: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => h('div', { class: 'el-empty-stub' }, props.description);
  }
});

const loadingDirective = {
  mounted(el: HTMLElement, binding: { value: boolean }) {
    el.setAttribute('data-loading', String(binding.value));
  },
  updated(el: HTMLElement, binding: { value: boolean }) {
    el.setAttribute('data-loading', String(binding.value));
  }
};

describe('layout/components/notice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    noticePanelMocks.store.state = reactive({
      notices: []
    });
    noticePanelMocks.store.readAll = noticePanelMocks.readAll;
  });

  const mountPanel = () =>
    mount(NoticePanel, {
      global: {
        directives: {
          loading: loadingDirective
        },
        stubs: {
          'el-empty': ElEmptyStub
        }
      }
    });

  it('renders empty state when no notice exists', async () => {
    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.find('.el-empty-stub').text()).toBe('消息为空');
  });

  it('marks notice as read on click and forwards readAll action', async () => {
    noticePanelMocks.store.state.notices = [
      {
        message: '待办消息',
        time: '2026-03-08 22:00:00',
        read: false
      },
      {
        message: '已读消息',
        time: '2026-03-08 22:01:00',
        read: true
      }
    ];

    const wrapper = mountPanel();
    await flushPromises();

    const items = wrapper.findAll('.content-box-item');
    expect(items).toHaveLength(2);
    expect(wrapper.text()).toContain('未读');

    await items[0].trigger('click');
    expect(noticePanelMocks.store.state.notices[0].read).toBe(true);

    await wrapper.find('.head-box-btn').trigger('click');
    expect(noticePanelMocks.readAll).toHaveBeenCalledTimes(1);
  });
});
