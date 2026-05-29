import { Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '@/api/admin';
import StatusTag from '@/components/common/StatusTag';

export default function AdminStats() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-stats'], queryFn: getStats });

  const statusRows = Object.entries(data?.task_status_counts ?? {}).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('nav.stats')}
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('common.refresh')}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('stats.taskTotal')} value={data?.task_total ?? 0} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('stats.userCount')} value={data?.user_count ?? 0} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Card>
            <Statistic
              title={t('stats.activeTokens')}
              value={data?.active_token_count ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Card>
            <Statistic
              title={t('stats.tokenUsage')}
              value={data?.token_usage_total ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Card>
            <Statistic
              title={t('stats.apiCost')}
              value={data?.api_cost_usd_total ?? 0}
              precision={4}
              prefix="$"
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('stats.statusBreakdown')}>
        {statusRows.length === 0 ? (
          <Empty />
        ) : (
          <Table
            rowKey="status"
            size="small"
            loading={isLoading}
            pagination={false}
            dataSource={statusRows}
            columns={[
              {
                title: t('task.status'),
                dataIndex: 'status',
                render: (v: string) => <StatusTag status={v} />,
              },
              {
                title: t('stats.count'),
                dataIndex: 'count',
                width: 120,
                render: (v: number) => <Tag>{v}</Tag>,
              },
            ]}
          />
        )}
      </Card>
    </Space>
  );
}
