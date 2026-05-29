import { App as AntdApp, Button, Popconfirm, Space, Table, Tooltip } from 'antd';
import { DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskListItem } from '@/api/types';
import { deleteTask } from '@/api/tasks';
import { extractErrorMessage } from '@/api/client';
import StatusTag from '@/components/common/StatusTag';
import ModeTag from '@/components/common/ModeTag';
import { formatDateTime } from '@/utils/format';

interface Props {
  data?: TaskListItem[];
  loading?: boolean;
  showUser?: boolean;
  allowDelete?: boolean;
  onRefresh?: () => void;
}

export default function TaskTable({ data, loading, showUser, allowDelete, onRefresh }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const delMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      message.success(t('task.deleted'));
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const columns: ColumnsType<TaskListItem> = [
    {
      title: t('task.taskId'),
      dataIndex: 'task_id',
      ellipsis: true,
      width: 150,
      render: (v: string) => <code style={{ fontSize: 12 }}>{v.slice(0, 12)}…</code>,
    },
    ...(showUser
      ? [{ title: t('task.user'), dataIndex: 'user_id', ellipsis: true, width: 140 } as const]
      : []),
    {
      title: t('task.topic'),
      dataIndex: 'topic',
      ellipsis: true,
      render: (v: string) => v || <span style={{ opacity: 0.5 }}>{t('task.noTopic')}</span>,
    },
    { title: t('task.mode'), dataIndex: 'mode', width: 120, render: (v: string) => <ModeTag mode={v} /> },
    {
      title: t('task.totalScore'),
      dataIndex: 'total_score',
      width: 80,
      render: (v: number) => v || '—',
    },
    {
      title: t('task.status'),
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: t('task.createdAt'),
      dataIndex: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: allowDelete ? 130 : 90,
      render: (_, r) => (
        <Space>
          <Tooltip title={t('common.view')}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/tasks/${r.task_id}`)}
            />
          </Tooltip>
          {allowDelete && (
            <Popconfirm
              title={t('task.deleteConfirm')}
              onConfirm={() => delMutation.mutate(r.task_id)}
              okText={t('common.yes')}
              cancelText={t('common.no')}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {onRefresh && (
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('common.refresh')}
          </Button>
        </div>
      )}
      <Table<TaskListItem>
        rowKey="task_id"
        size="middle"
        loading={loading}
        dataSource={data}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
    </>
  );
}
