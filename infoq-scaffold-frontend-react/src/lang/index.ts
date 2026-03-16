import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LanguageEnum } from '@/enums/LanguageEnum';

const resources = {
  zh_CN: {
    translation: {
      login: {
        title: 'infoq-scaffold-backend 后台管理系统',
        username: '用户名',
        password: '密码',
        code: '验证码',
        rememberPassword: '记住我',
        switchRegisterPage: '立即注册',
        login: '登 录',
        logging: '登 录 中...'
      },
      register: {
        username: '用户名',
        password: '密码',
        confirmPassword: '确认密码',
        code: '验证码',
        register: '注 册',
        registering: '注 册 中...',
        registerSuccess: '恭喜你，您的账号 {{username}} 注册成功！',
        switchLoginPage: '使用已有账户登录',
        rule: {
          username: {
            required: '请输入您的账号',
            length: '用户账号长度必须介于 {{min}} 和 {{max}} 之间'
          },
          password: {
            required: '请输入您的密码',
            length: '用户密码长度必须介于 {{min}} 和 {{max}} 之间',
            pattern: '不能包含非法字符：{{strings}}'
          },
          code: {
            required: '请输入验证码'
          },
          confirmPassword: {
            required: '请再次输入您的密码',
            equalToPassword: '两次输入的密码不一致'
          }
        }
      },
      common: {
        logout: '退出登录',
        welcome: '欢迎使用'
      },
      navbar: {
        search: '搜索',
        message: '消息',
        full: '全屏',
        language: '语言',
        layoutSize: '布局大小',
        layoutSetting: '布局设置',
        layoutSizeUpdated: '布局大小切换成功！',
        personalCenter: '个人中心',
        github: 'Github'
      },
      notice: {
        title: '通知公告',
        markAllRead: '全部已读',
        empty: '消息为空',
        read: '已读',
        unread: '未读'
      },
      settings: {
        appearanceTitle: '主题风格设置',
        layoutTitle: '系统布局配置',
        themeColor: '主题颜色',
        darkMode: '深色模式',
        themeDark: '深色侧栏',
        themeLight: '浅色侧栏',
        topNav: '开启 TopNav',
        tagsView: '开启 Tags-Views',
        tagsIcon: '显示页签图标',
        fixedHeader: '固定 Header',
        sidebarLogo: '显示 Logo',
        dynamicTitle: '动态标题',
        save: '保存配置',
        reset: '重置配置',
        saved: '配置已保存到本地',
        resetDone: '已恢复默认布局配置'
      }
    }
  },
  en_US: {
    translation: {
      login: {
        title: 'InfoQ Scaffold Admin',
        username: 'Please enter your username',
        password: 'Please enter your password',
        code: 'Please enter the verification code',
        rememberPassword: 'Remember me',
        switchRegisterPage: 'Sign up now',
        login: 'Login',
        logging: 'Signing in...'
      },
      register: {
        username: 'Please enter your username',
        password: 'Please enter your password',
        confirmPassword: 'Please enter your password again',
        code: 'Please enter the verification code',
        register: 'Register',
        registering: 'Registering...',
        registerSuccess: 'Congratulations, your {{username}} account has been registered!',
        switchLoginPage: 'Log in with an existing account',
        rule: {
          username: {
            required: 'Please enter your account',
            length: 'The length of the user account must be between {{min}} and {{max}}'
          },
          password: {
            required: 'Please enter your password',
            length: 'The user password must be between {{min}} and {{max}} in length',
            pattern: "Can't contain illegal characters: {{strings}}"
          },
          code: {
            required: 'Please enter a verification code'
          },
          confirmPassword: {
            required: 'Please enter your password again',
            equalToPassword: 'The password entered twice is inconsistent'
          }
        }
      },
      common: {
        logout: 'Logout',
        welcome: 'Welcome'
      },
      navbar: {
        search: 'Search',
        message: 'Message',
        full: 'Full Screen',
        language: 'Language',
        layoutSize: 'Layout Size',
        layoutSetting: 'Layout Setting',
        layoutSizeUpdated: 'Layout size updated successfully!',
        personalCenter: 'Personal Center',
        github: 'Github'
      },
      notice: {
        title: 'Notifications',
        markAllRead: 'Mark all as read',
        empty: 'No messages',
        read: 'Read',
        unread: 'Unread'
      },
      settings: {
        appearanceTitle: 'Theme Style Settings',
        layoutTitle: 'System Layout Settings',
        themeColor: 'Theme Color',
        darkMode: 'Dark Mode',
        themeDark: 'Dark Sidebar',
        themeLight: 'Light Sidebar',
        topNav: 'Enable TopNav',
        tagsView: 'Enable Tags-Views',
        tagsIcon: 'Show Tag Icons',
        fixedHeader: 'Fixed Header',
        sidebarLogo: 'Show Logo',
        dynamicTitle: 'Dynamic Title',
        save: 'Save Settings',
        reset: 'Reset Settings',
        saved: 'Settings saved locally',
        resetDone: 'Layout settings reset to defaults'
      }
    }
  }
};

export const getLanguage = (): LanguageEnum => {
  return (localStorage.getItem('language') as LanguageEnum) || LanguageEnum.zh_CN;
};

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage(),
  fallbackLng: LanguageEnum.zh_CN,
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
