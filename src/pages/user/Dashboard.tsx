import { useMemo } from 'react';
import { Button, Card, Col, Row, Statistic, Typography } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyTasks } from '@/hooks/useTasks';
import { useAuth } from '@/auth/AuthContext';
import TaskTable from '@/components/task/TaskTable';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useMyTasks({ limit: 100, offset: 0 });

  const stats = useMemo(() => {
    const list = data?.items ?? [];
    return {
      total: data?.total ?? list.length,
      running: list.filter((x) => x.status === 'running' || x.status === 'queued').length,
      done: list.filter((x) => x.status === 'done').length,
      failed: list.filter((x) => ['error', 'aborted', 'interrupted'].includes(x.status)).length,
    };
  }, [data]);

  const recent = useMemo(() => (data?.items ?? []).slice(0, 8), [data]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('nav.dashboard')}
          {isAdmin ? ` · ${t('auth.roleAdmin')}` : ''}
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={() => navigate('/tasks/new')}
        >
          {t('nav.newTask')}
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title={t('nav.myTasks')} value={stats.total} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('status.running')}
              value={stats.running}
              loading={isLoading}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('status.done')}
              value={stats.done}
              loading={isLoading}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('status.error')}
              value={stats.failed}
              loading={isLoading}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('nav.myTasks')}>
        <TaskTable data={recent} loading={isLoading} allowDelete />
      </Card>
    </div>
  );
}
