import { Button, Checkbox, Form, Input } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCodeImg } from '@/api/login';
import type { LoginData } from '@/api/types';
import AuthPageShell from '@/components/AuthPageShell';
import SvgIcon from '@/components/SvgIcon';
import { useUserStore } from '@/store/modules/user';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [form] = Form.useForm<LoginData>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [codeUrl, setCodeUrl] = useState('');
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);
  const { t } = useTranslation();
  const title = import.meta.env.VITE_APP_TITLE || t('login.title');
  const authIconStyle = { color: '#bfbfbf' };

  const getCode = useCallback(async () => {
    let data: { captchaEnabled?: boolean; uuid?: string; img?: string } | undefined;
    try {
      const res = await getCodeImg();
      data = res?.data;
    } catch {
      data = undefined;
    }
    if (!data) {
      setCaptchaEnabled(false);
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
      username: localStorage.getItem('username') || '',
      password: localStorage.getItem('password') || '',
      rememberMe: localStorage.getItem('rememberMe') === 'true'
    });
    getCode();
  }, [form, getCode, title]);

  const onFinish = async (values: LoginData) => {
    setLoading(true);
    try {
      const submitValues = form.getFieldsValue(true) as LoginData;
      if (values.rememberMe) {
        localStorage.setItem('username', values.username || '');
        localStorage.setItem('password', values.password || '');
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      await login(submitValues);
      const redirect = searchParams.get('redirect') || '/index';
      navigate(decodeURIComponent(redirect));
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
      <Form className="auth-login-form" form={form} onFinish={onFinish} initialValues={{ rememberMe: false }}>
        <Form.Item name="uuid" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="username" rules={[{ required: true, message: t('login.username') }]} style={{ marginBottom: 22 }}>
          <Input
            size="large"
            placeholder={t('login.username')}
            autoComplete="username"
            prefix={<SvgIcon iconClass="user" size={14} style={authIconStyle} />}
          />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: t('login.password') }]} style={{ marginBottom: 22 }}>
          <Input.Password
            size="large"
            placeholder={t('login.password')}
            autoComplete="current-password"
            prefix={<SvgIcon iconClass="password" size={14} style={authIconStyle} />}
            visibilityToggle={false}
            onPressEnter={() => form.submit()}
          />
        </Form.Item>
        {captchaEnabled && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 }}>
            <Form.Item name="code" rules={[{ required: true, message: t('login.code') }]} style={{ width: '63%', marginBottom: 0 }}>
              <Input
                size="large"
                placeholder={t('login.code')}
                autoComplete="off"
                prefix={<SvgIcon iconClass="validCode" size={14} style={authIconStyle} />}
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <div style={{ width: '33%', height: 40 }}>
              {codeUrl ? (
                <img
                  src={codeUrl}
                  alt={t('login.code')}
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
        <Form.Item name="rememberMe" valuePropName="checked" style={{ marginBottom: 25 }}>
          <Checkbox>{t('login.rememberPassword')}</Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 18 }}>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ height: 40 }}>
            {loading ? t('login.logging') : t('login.login')}
          </Button>
        </Form.Item>
      </Form>
    </AuthPageShell>
  );
}
