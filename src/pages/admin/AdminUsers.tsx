import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ProfileOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, deleteUser, getUser, listUsers, updateUser } from '@/api/admin';
import { extractErrorMessage } from '@/api/client';
import type { UserInfo } from '@/api/types';
import { formatDateTime } from '@/utils/format';

export default function AdminUsers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserInfo | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', search],
    queryFn: () => listUsers({ limit: 200, q: search || undefined }),
  });

  const { data: editingDetail } = useQuery({
    queryKey: ['user', editing?.user_id],
    queryFn: () => getUser(editing!.user_id),
    enabled: !!editing,
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success(t('admin.userCreated'));
      setOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (v: { userId: string; label: string }) => updateUser(v.userId, { label: v.label }),
    onSuccess: () => {
      message.success(t('admin.userUpdated'));
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success(t('admin.userDeleted'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const columns: ColumnsType<UserInfo> = [
    {
      title: t('admin.userId'),
      dataIndex: 'user_id',
      render: (v: string) => <Typography.Text copyable>{v}</Typography.Text>,
    },
    { title: t('admin.userLabel'), dataIndex: 'label', render: (v: string) => v || '—' },
    {
      title: t('admin.createdAt'),
      dataIndex: 'created_at',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 220,
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<ProfileOutlined />}
            onClick={() => navigate(`/admin/users/${r.user_id}/tasks`)}
          >
            {t('admin.viewTasks')}
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(r);
              editForm.setFieldsValue({ label: r.label ?? '' });
            }}
          />
          <Popconfirm
            title={t('admin.deleteUserConfirm')}
            onConfirm={() => deleteMutation.mutate(r.user_id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t('nav.users')}
      extra={
        <Space>
          <Input.Search
            allowClear
            placeholder={t('admin.searchUsers')}
            onSearch={(v) => setSearch(v.trim())}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            {t('admin.createUser')}
          </Button>
        </Space>
      }
    >
      <Table<UserInfo>
        rowKey="user_id"
        loading={isLoading}
        dataSource={data?.items}
        columns={columns}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={t('admin.createUser')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={mutation.isPending}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate({ label: v.label })}>
          <Form.Item name="label" label={t('admin.userLabel')}>
            <Input placeholder={t('admin.userLabelPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('admin.editUser')}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(v) =>
            editing && updateMutation.mutate({ userId: editing.user_id, label: v.label ?? '' })
          }
        >
          <Form.Item name="label" label={t('admin.userLabel')}>
            <Input placeholder={t('admin.userLabelPlaceholder')} />
          </Form.Item>
          {editingDetail && (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('admin.tokenCountLabel')}: {editingDetail.token_count} ·{' '}
              {t('admin.taskCountLabel')}: {editingDetail.task_count}
            </Typography.Paragraph>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
