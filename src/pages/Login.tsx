import { useState } from 'react';
import { Button, Card, Form, Input, Typography, App as AntdApp } from 'antd';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth/AuthContext';
import HeaderControls from '@/components/layout/HeaderControls';
import logoUrl from '/favicon.png';

export default function Login() {
  const { t } = useTranslation();
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntdApp.useApp();
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    const from = (location.state as any)?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const onFinish = async ({ token }: { token: string }) => {
    setSubmitting(true);
    const ok = await login(token);
    setSubmitting(false);
    if (ok) {
      const from = (location.state as any)?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } else {
      message.error(t('auth.invalidToken'));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background: 'linear-gradient(135deg, rgba(47,84,235,0.08), rgba(47,84,235,0.02))',
      }}
    >
      <div style={{ position: 'fixed', top: 12, right: 16 }}>
        <HeaderControls />
      </div>
      <Card style={{ width: 'min(420px, 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={logoUrl} alt="logo" width={48} height={48} style={{ borderRadius: 10 }} />
          <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
            {t('common.appName')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('auth.loginSubtitle')}</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="token"
            label={t('auth.tokenLabel')}
            rules={[{ required: true, message: t('auth.tokenLabel') }]}
          >
            <Input.Password
              autoFocus
              placeholder={t('auth.tokenPlaceholder')}
              autoComplete="off"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {t('auth.signIn')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
