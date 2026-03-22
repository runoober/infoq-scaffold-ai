import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { ElMessageBox } from 'element-plus/es';
import RegisterView from '@/views/register.vue';

const registerMocks = vi.hoisted(() => {
  return {
    getCodeImg: vi.fn(),
    register: vi.fn(),
    routerPush: vi.fn(),
    t: vi.fn((key: string) => key)
  };
});

vi.mock('@/api/login', () => ({
  getCodeImg: registerMocks.getCodeImg,
  register: registerMocks.register
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: registerMocks.routerPush
  }))
}));

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: registerMocks.t
  }))
}));

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { slots, expose }) {
    expose({
      validate: (cb: (valid: boolean) => void) => cb(true)
    });
    return () => h('form', { class: 'el-form-stub' }, slots.default?.());
  }
});

const ElButtonStub = defineComponent({
  name: 'ElButton',
  emits: ['click'],
  setup(_, { emit, slots }) {
    return () =>
      h(
        'button',
        {
          class: 'register-submit-btn',
          onClick: (e: MouseEvent) => emit('click', e)
        },
        slots.default?.()
      );
  }
});

const passthroughStub = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    }
  });

describe('views/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMocks.getCodeImg.mockResolvedValue({
      data: {
        captchaEnabled: true,
        img: 'img-data',
        uuid: 'uuid-2'
      }
    });
    registerMocks.register.mockResolvedValue(undefined);
  });

  const mountView = () =>
    mount(RegisterView, {
      global: {
        config: {
          globalProperties: {
            $t: (key: string) => key
          } as any
        },
        stubs: {
          'el-form': ElFormStub,
          'el-form-item': passthroughStub('ElFormItem'),
          'el-input': passthroughStub('ElInput'),
          'el-button': ElButtonStub,
          'router-link': true,
          'lang-select': true,
          'svg-icon': true
        }
      }
    });

  it('registers successfully and redirects to login', async () => {
    const wrapper = mountView();
    await flushPromises();
    await wrapper.find('button.register-submit-btn').trigger('click');
    await flushPromises();

    expect(registerMocks.register).toHaveBeenCalledTimes(1);
    expect((ElMessageBox as any).alert).toHaveBeenCalled();
    expect(registerMocks.routerPush).toHaveBeenCalledWith('/login');
  });

  it('refreshes captcha after register failure', async () => {
    registerMocks.register.mockRejectedValueOnce(new Error('register-failed'));

    const wrapper = mountView();
    await flushPromises();
    await wrapper.find('button.register-submit-btn').trigger('click');
    await flushPromises();

    expect(registerMocks.getCodeImg).toHaveBeenCalledTimes(2);
    expect(registerMocks.routerPush).not.toHaveBeenCalled();
  });

  it('validates confirm password rule for mismatch and match', async () => {
    const wrapper = mountView();
    await flushPromises();

    const vm = wrapper.vm as any;
    vm.registerForm.password = 'Pass@123';
    const validator = vm.registerRules.confirmPassword[1].validator as (rule: any, value: string, cb: (error?: Error) => void) => void;

    const mismatchCb = vi.fn();
    validator({}, 'Mismatch@123', mismatchCb);
    expect(mismatchCb).toHaveBeenCalledWith(expect.any(Error));

    const matchCb = vi.fn();
    validator({}, 'Pass@123', matchCb);
    expect(matchCb).toHaveBeenCalledWith();
  });
});
