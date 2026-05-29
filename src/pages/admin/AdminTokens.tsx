import { useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { KeyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createToken, listTokens, listUsers, revokeToken } from '@/api/admin';
import { extractErrorMessage } from '@/api/client';
import type { TokenCreated, TokenInfo } from '@/api/types';
import { formatDateTime } from '@/utils/format';

export default function AdminTokens() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [filterUser, setFilterUser] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [created, setCreated] = useState<TokenCreated | null>(null);

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => listUsers({ limit: 200 }) });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tokens', filterUser, search],
    queryFn: () => listTokens(filterUser, { limit: 200, q: search || undefined }),
  });

  const userOptions = (users?.items ?? []).map((u) => ({
    value: u.user_id,
    label: u.label ? `${u.label} (${u.user_id.slice(0, 8)}…)` : u.user_id,
  }));

  const createMutation = useMutation({
    mutationFn: createToken,
    onSuccess: (d) => {
      setCreated(d);
      setOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeToken,
    onSuccess: () => {
      message.success(t('admin.revoked'));
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const columns: ColumnsType<TokenInfo> = [
    { title: 'ID', dataIndex: 'id', ellipsis: true, width: 140 },
    { title: t('admin.tokenForUser'), dataIndex: 'user_id', ellipsis: true, width: 160 },
    {
      title: t('admin.tokenRole'),
      dataIndex: 'role',
      width: 100,
      render: (v: string) => <Tag color={v === 'admin' ? 'geekblue' : 'green'}>{v}</Tag>,
    },
    { title: t('admin.tokenLabel'), dataIndex: 'label', render: (v: string) => v || '—' },
    {
      title: t('admin.createdAt'),
      dataIndex: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('admin.revokedAt'),
      dataIndex: 'revoked_at',
      width: 130,
      render: (v: string | null) =>
        v ? formatDateTime(v) : <Tag color="success">{t('admin.active')}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 110,
      render: (_, r) =>
        r.revoked_at ? null : (
          <Popconfirm
            title={t('admin.revokeConfirm')}
            onConfirm={() => revokeMutation.mutate(r.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button size="small" danger>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <Card
      title={t('nav.tokens')}
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder={t('admin.searchTokens')}
            onSearch={(v) => setSearch(v.trim())}
            style={{ width: 180 }}
          />
          <Select
            allowClear
            placeholder={t('admin.filterByUser')}
            style={{ minWidth: 200 }}
            options={userOptions}
            value={filterUser}
            onChange={setFilterUser}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          <Button type="primary" icon={<KeyOutlined />} onClick={() => setOpen(true)}>
            {t('admin.createToken')}
          </Button>
        </Space>
      }
    >
      <Table<TokenInfo>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.items}
        columns={columns}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={t('admin.createToken')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'user' }}
          onFinish={(v) => createMutation.mutate(v)}
        >
          <Form.Item
            name="user_id"
            label={t('admin.tokenForUser')}
            rules={[{ required: true, message: t('admin.selectUser') }]}
          >
            <Select showSearch optionFilterProp="label" placeholder={t('admin.selectUser')} options={userOptions} />
          </Form.Item>
          <Form.Item name="role" label={t('admin.tokenRole')}>
            <Select
              options={[
                { value: 'user', label: t('auth.roleUser') },
                { value: 'admin', label: t('auth.roleAdmin') },
              ]}
            />
          </Form.Item>
          <Form.Item name="label" label={t('admin.tokenLabel')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('admin.tokenCreatedTitle')}
        open={!!created}
        onCancel={() => setCreated(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setCreated(null)}>
            {t('common.close')}
          </Button>,
        ]}
      >
        <Alert type="warning" showIcon message={t('admin.tokenCreatedWarning')} style={{ marginBottom: 12 }} />
        <Typography.Paragraph copyable={{ text: created?.token }}>
          <code style={{ wordBreak: 'break-all' }}>{created?.token}</code>
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
}
