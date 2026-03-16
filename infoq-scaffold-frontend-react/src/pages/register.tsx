import { App, Button, Form, Input } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCodeImg, register as registerApi } from '@/api/login';
import type { RegisterForm } from '@/api/types';
import AuthPageShell from '@/components/AuthPageShell';
import SvgIcon from '@/components/SvgIcon';
import { useTranslation } from 'react-i18next';

type VerifyCodeState = {
  captchaEnabled?: boolean;
  uuid?: string;
  img?: string;
};

const ILLEGAL_PASSWORD_CHARS = '< > " \' \\ |';

export default function RegisterPage() {
  const [form] = Form.useForm<RegisterForm>();
  const [loading, setLoading] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [codeUrl, setCodeUrl] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const title = import.meta.env.VITE_APP_TITLE || t('login.title');
  const authIconStyle = { color: '#bfbfbf' };

  const getCode = useCallback(async () => {
    let data: VerifyCodeState | undefined;
    try {
      const res = await getCodeImg();
      data = res?.data;
    } catch {
      data = undefined;
    }

    if (!data) {
      setCaptchaEnabled(false);
      setCodeUrl('');
      form.setFieldValue('uuid', undefined);
      form.setFieldValue('code', undefined);
      return;
    }

    const enabled = data.captchaEnabled === undefined ? true : data.captchaEnabled;
    setCaptchaEnabled(enabled);
    if (enabled) {
      setCodeUrl(`data:image/gif;base64,${data.img}`);
      form.setFieldValue('uuid', data.uuid);
      form.setFieldValue('code', '');
    } else {
      setCodeUrl('');
      form.setFieldValue('uuid', undefined);
      form.setFieldValue('code', undefined);
    }
  }, [form]);

  useEffect(() => {
    document.title = title;
    form.setFieldsValue({
      username: '',
      password: '',
      confirmPassword: '',
      code: '',
      uuid: '',
      userType: 'sys_user'
    });
    getCode();
  }, [form, getCode, title]);

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      await registerApi({
        ...values,
        userType: 'sys_user'
      });

      await new Promise<void>((resolve) => {
        modal.success({
          title: '系统提示',
          content: t('register.registerSuccess', { username: values.username }),
          okText: '确定',
          onOk: () => resolve()
        });
      });

      navigate('/login');
    } catch {
      if (captchaEnabled) {
        await getCode();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell title={title}>
      <Form form={form} onFinish={onFinish} initialValues={{ userType: 'sys_user' }}>
        <Form.Item name="uuid" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="userType" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="username"
          style={{ marginBottom: 22 }}
          rules={[
            { required: true, message: t('register.rule.username.required') },
            { min: 2, max: 20, message: t('register.rule.username.length', { min: 2, max: 20 }) }
          ]}
        >
          <Input
            size="large"
            autoComplete="username"
            placeholder={t('register.username')}
            prefix={<SvgIcon iconClass="user" size={14} style={authIconStyle} />}
          />
        </Form.Item>

        <Form.Item
          name="password"
          style={{ marginBottom: 22 }}
          rules={[
            { required: true, message: t('register.rule.password.required') },
            { min: 5, max: 20, message: t('register.rule.password.length', { min: 5, max: 20 }) },
            { pattern: /^[^<>"'|\\]+$/, message: t('register.rule.password.pattern', { strings: ILLEGAL_PASSWORD_CHARS }) }
          ]}
        >
          <Input.Password
            size="large"
            autoComplete="new-password"
            placeholder={t('register.password')}
            prefix={<SvgIcon iconClass="password" size={14} style={authIconStyle} />}
            visibilityToggle={false}
            onPressEnter={() => form.submit()}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          style={{ marginBottom: 22 }}
          rules={[
            { required: true, message: t('register.rule.confirmPassword.required') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('register.rule.confirmPassword.equalToPassword')));
              }
            })
          ]}
        >
          <Input.Password
            size="large"
            autoComplete="new-password"
            placeholder={t('register.confirmPassword')}
            prefix={<SvgIcon iconClass="password" size={14} style={authIconStyle} />}
            visibilityToggle={false}
            onPressEnter={() => form.submit()}
          />
        </Form.Item>

        {captchaEnabled && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 }}>
            <Form.Item name="code" rules={[{ required: true, message: t('register.rule.code.required') }]} style={{ width: '63%', marginBottom: 0 }}>
              <Input
                size="large"
                autoComplete="off"
                placeholder={t('register.code')}
                prefix={<SvgIcon iconClass="validCode" size={14} style={authIconStyle} />}
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <div style={{ width: '33%', height: 40 }}>
              {codeUrl ? (
                <img
                  src={codeUrl}
                  alt={t('register.code')}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    paddingLeft: 12,
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onClick={getCode}
                />
              ) : null}
            </div>
          </div>
        )}

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ height: 40 }}>
            {loading ? t('register.registering') : t('register.register')}
          </Button>
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Link to="/login">{t('register.switchLoginPage')}</Link>
          </div>
        </Form.Item>
      </Form>
    </AuthPageShell>
  );
}
