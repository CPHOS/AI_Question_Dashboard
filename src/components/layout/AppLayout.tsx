import { useMemo, useState } from 'react';
import { Layout, Menu, Button, Tag, Typography, Grid, Drawer, Badge, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  KeyOutlined,
  ProfileOutlined,
  LogoutOutlined,
  MenuOutlined,
  BarChartOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { getHealth, getVersion } from '@/api/system';
import HeaderControls from './HeaderControls';

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logout, role } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
    staleTime: Infinity,
  });
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items: MenuProps['items'] = useMemo(() => {
    const base: MenuProps['items'] = [
      { key: '/dashboard', icon: <AppstoreOutlined />, label: t('nav.dashboard') },
      { key: '/tasks/new', icon: <PlusCircleOutlined />, label: t('nav.newTask') },
      { key: '/tasks', icon: <UnorderedListOutlined />, label: t('nav.myTasks') },
    ];
    if (isAdmin) {
      base.push({
        key: 'admin',
        label: t('nav.admin'),
        type: 'group',
        children: [
          { key: '/admin/stats', icon: <BarChartOutlined />, label: t('nav.stats') },
          { key: '/admin/users', icon: <TeamOutlined />, label: t('nav.users') },
          { key: '/admin/tokens', icon: <KeyOutlined />, label: t('nav.tokens') },
          { key: '/admin/tasks', icon: <ProfileOutlined />, label: t('nav.allTasks') },
          { key: '/admin/llm', icon: <ApiOutlined />, label: t('nav.llmSettings') },
        ],
      });
    }
    return base;
  }, [t, isAdmin]);

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/admin/stats')) return '/admin/stats';
    if (path.startsWith('/admin/users')) return '/admin/users';
    if (path.startsWith('/admin/tokens')) return '/admin/tokens';
    if (path.startsWith('/admin/tasks')) return '/admin/tasks';
    if (path.startsWith('/admin/llm')) return '/admin/llm';
    if (path.startsWith('/tasks/new')) return '/tasks/new';
    if (path.startsWith('/tasks')) return '/tasks';
    return '/dashboard';
  }, [location.pathname]);

  const onNavigate: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  // Footer health indicator: ok → green, degraded → amber, unknown → grey.
  const healthBadgeStatus: 'success' | 'warning' | 'default' = !health
    ? 'default'
    : health.status === 'ok'
      ? 'success'
      : 'warning';
  const healthTooltip = health ? (
    <div style={{ fontSize: 12 }}>
      <div>{t('health.overall')}: {t(`health.${health.status}`, { defaultValue: health.status })}</div>
      {Object.entries(health.components ?? {}).map(([name, c]) => (
        <div key={name}>
          {name}: {t(`health.${c.status}`, { defaultValue: c.status })}
          {c.detail ? ` (${c.detail})` : ''}
        </div>
      ))}
    </div>
  ) : (
    t('health.unknown')
  );

  const brand = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        height: 56,
        overflow: 'hidden',
      }}
    >
      <img src="/favicon.png" alt="logo" width={28} height={28} style={{ borderRadius: 6 }} />
      <Typography.Text strong style={{ fontSize: 15, whiteSpace: 'nowrap' }}>
        {t('common.appShort')}
      </Typography.Text>
    </div>
  );

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={items}
      onClick={onNavigate}
      style={{ borderInlineEnd: 'none' }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider theme="light" width={220} style={{ borderInlineEnd: '1px solid rgba(128,128,128,0.2)' }}>
          {brand}
          {menu}
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            background: 'transparent',
            borderBottom: '1px solid rgba(128,128,128,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile && (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            )}
            <Tag color={isAdmin ? 'geekblue' : 'green'}>
              {isAdmin ? t('auth.roleAdmin') : t('auth.roleUser')}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeaderControls />
            <Button icon={<LogoutOutlined />} onClick={logout} aria-label={t('auth.signOut')}>
              {!isMobile && t('auth.signOut')}
            </Button>
          </div>
        </Header>
        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', padding: '12px 16px', color: 'rgba(128,128,128,0.85)' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <Tooltip title={healthTooltip}>
              <Badge
                status={healthBadgeStatus}
                text={
                  version
                    ? `${version.name} v${version.version} · ${version.license}`
                    : t('common.appShort')
                }
              />
            </Tooltip>
          </Typography.Text>
        </Footer>
      </Layout>

      <Drawer
        placement="left"
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
        width={240}
        title={t('common.appShort')}
      >
        {menu}
        <div style={{ padding: 16, color: 'rgba(128,128,128,0.8)' }}>
          {t('auth.' + (role === 'admin' ? 'roleAdmin' : 'roleUser'))}
        </div>
      </Drawer>
    </Layout>
  );
}
