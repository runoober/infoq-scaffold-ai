import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import LoginView from '@/views/login.vue';

const loginMocks = vi.hoisted(() => {
  return {
    getCodeImg: vi.fn(),
    userLogin: vi.fn(),
    routerPush: vi.fn(),
    formValidate: vi.fn((cb: (valid: boolean, fields?: any) => void) => cb(true, {})),
    currentRoute: {
      value: {
        query: {
          redirect: encodeURIComponent('/system/menu')
        }
      }
    },
    t: vi.fn((key: string) => key)
  };
});

vi.mock('@/api/login', () => ({
  getCodeImg: loginMocks.getCodeImg
}));

vi.mock('@/store/modules/user', () => ({
  useUserStore: vi.fn(() => ({
    login: loginMocks.userLogin
  }))
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    currentRoute: loginMocks.currentRoute,
    push: loginMocks.routerPush
  }))
}));

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: loginMocks.t
  }))
}));

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { slots, expose }) {
    expose({
      validate: (cb: (valid: boolean, fields?: any) => void) => loginMocks.formValidate(cb)
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
          class: 'login-submit-btn',
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

describe('views/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    loginMocks.getCodeImg.mockResolvedValue({
      data: {
        captchaEnabled: true,
        img: 'img-data',
        uuid: 'uuid-1'
      }
    });
    loginMocks.userLogin.mockResolvedValue(undefined);
    loginMocks.formValidate.mockImplementation((cb: (valid: boolean, fields?: any) => void) => cb(true, {}));
  });

  const mountView = () =>
    mount(LoginView, {
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
          'el-checkbox': passthroughStub('ElCheckbox'),
          'el-button': ElButtonStub,
          'router-link': true,
          'lang-select': true,
          'svg-icon': true
        }
      }
    });

  it('logs in successfully and clears remembered credentials when rememberMe is false', async () => {
    window.localStorage.setItem('username', 'admin');
    window.localStorage.setItem('password', '123456');
    window.localStorage.setItem('rememberMe', 'false');

    const wrapper = mountView();
    await flushPromises();
    await wrapper.find('button.login-submit-btn').trigger('click');
    await flushPromises();

    expect(loginMocks.userLogin).toHaveBeenCalledTimes(1);
    expect(loginMocks.routerPush).toHaveBeenCalledWith('/system/menu');
    expect(window.localStorage.getItem('username')).toBeNull();
    expect(window.localStorage.getItem('password')).toBeNull();
    expect(window.localStorage.getItem('rememberMe')).toBeNull();
  });

  it('refreshes captcha after login failure', async () => {
    loginMocks.userLogin.mockRejectedValueOnce(new Error('login-failed'));

    const wrapper = mountView();
    await flushPromises();
    await wrapper.find('button.login-submit-btn').trigger('click');
    await flushPromises();

    expect(loginMocks.getCodeImg).toHaveBeenCalledTimes(2);
    expect(loginMocks.routerPush).not.toHaveBeenCalled();
  });

  it('stores remembered credentials when rememberMe is true', async () => {
    const wrapper = mountView();
    await flushPromises();

    const vm = wrapper.vm as any;
    vm.loginForm.username = 'remember-user';
    vm.loginForm.password = 'remember-pass';
    vm.loginForm.rememberMe = true;

    await wrapper.find('button.login-submit-btn').trigger('click');
    await flushPromises();

    expect(window.localStorage.getItem('username')).toBe('remember-user');
    expect(window.localStorage.getItem('password')).toBe('remember-pass');
    expect(window.localStorage.getItem('rememberMe')).toBe('true');
  });

  it('logs validation errors when form validation fails', async () => {
    loginMocks.formValidate.mockImplementationOnce((cb: (valid: boolean, fields?: any) => void) =>
      cb(false, { username: [{ message: 'required' }] })
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const wrapper = mountView();
    await flushPromises();
    await wrapper.find('button.login-submit-btn').trigger('click');
    await flushPromises();

    expect(loginMocks.userLogin).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('error submit!', { username: [{ message: 'required' }] });
    logSpy.mockRestore();
  });
});
