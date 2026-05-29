import { useMemo } from 'react';
import { Alert, App as AntdApp, Badge, Button, Card, Col, Descriptions, Popconfirm, Row, Space, Spin } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, RedoOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useTaskArtifacts,
  useTaskEvents,
  useTaskProgress,
  useTaskResult,
  useTaskStatus,
} from '@/hooks/useTasks';
import { cancelTask, retryTask } from '@/api/tasks';
import { extractErrorMessage } from '@/api/client';
import { isTerminal } from '@/utils/phase';
import { formatDateTime } from '@/utils/format';
import StatusTag from '@/components/common/StatusTag';
import ModeTag from '@/components/common/ModeTag';
import WorkflowTimeline from '@/components/task/WorkflowTimeline';
import ResultViewer from '@/components/task/ResultViewer';

export default function TaskDetail() {
  const { taskId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const live = useTaskEvents(taskId, !!taskId);
  const { data: status, isLoading, refetch } = useTaskStatus(taskId, !live.connected);
  const { data: progress } = useTaskProgress(taskId, status?.status, !live.connected);
  const done = status?.status === 'done';
  const terminal = isTerminal(status?.status);
  const cancellable = status?.status === 'queued' || status?.status === 'running';
  const retryable = status?.status === 'error' || status?.status === 'aborted';
  const { data: artifacts, isLoading: artifactsLoading } = useTaskArtifacts(taskId, terminal);
  const { data: result } = useTaskResult(taskId, done);

  const cancelMutation = useMutation({
    mutationFn: () => cancelTask(taskId),
    onSuccess: () => {
      message.success(t('task.cancelRequested'));
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      void refetch();
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryTask(taskId),
    onSuccess: (created) => {
      message.success(t('task.retryStarted'));
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      navigate(`/tasks/${created.task_id}`);
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const summaryItems = useMemo(() => {
    const s = status?.summary;
    if (!s || typeof s !== 'object') return [];
    return Object.entries(s).filter(([, v]) => typeof v !== 'object');
  }, [status?.summary]);

  if (isLoading && !status) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('common.refresh')}
        </Button>
        {cancellable && (
          <Popconfirm
            title={t('task.cancelConfirm')}
            onConfirm={() => cancelMutation.mutate()}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<StopOutlined />} loading={cancelMutation.isPending}>
              {t('task.cancel')}
            </Button>
          </Popconfirm>
        )}
        {retryable && (
          <Button
            icon={<RedoOutlined />}
            loading={retryMutation.isPending}
            onClick={() => retryMutation.mutate()}
          >
            {t('task.retry')}
          </Button>
        )}
        {live.connected && !terminal && (
          <Badge status="processing" text={t('task.live')} />
        )}
      </Space>

      <Card>
        <Descriptions
          title={status?.topic || t('task.noTopic')}
          column={{ xs: 1, sm: 2, md: 3 }}
          size="small"
        >
          <Descriptions.Item label={t('task.status')}>
            <StatusTag status={status?.status ?? ''} />
          </Descriptions.Item>
          <Descriptions.Item label={t('task.phase')}>
            {status?.phase ? t(`phase.${status.phase}`, { defaultValue: status.phase }) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('task.mode')}>
            <ModeTag mode={status?.mode} />
          </Descriptions.Item>
          <Descriptions.Item label={t('task.totalScore')}>
            {status?.total_score || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('task.createdAt')}>
            {formatDateTime(status?.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('task.finishedAt')}>
            {formatDateTime(status?.finished_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('task.taskId')} span={3}>
            <code>{taskId}</code>
          </Descriptions.Item>
        </Descriptions>

        {status?.error && (
          <Alert type="error" showIcon message={t('task.error')} description={status.error} />
        )}

        {summaryItems.length > 0 && (
          <Descriptions
            title={t('task.summary')}
            column={{ xs: 1, sm: 2, md: 3 }}
            size="small"
            style={{ marginTop: 16 }}
          >
            {summaryItems.map(([k, v]) => (
              <Descriptions.Item key={k} label={k}>
                {String(v)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={done ? 12 : 24}>
          <Card title={t('task.progress')}>
            <WorkflowTimeline progress={progress} taskStatus={status?.status} />
          </Card>
        </Col>
        {done && (
          <Col xs={24} xl={12}>
            <Card title={t('task.result')}>
              <ResultViewer
                taskId={taskId}
                result={result}
                artifacts={artifacts ?? []}
                artifactsLoading={artifactsLoading}
              />
            </Card>
          </Col>
        )}
      </Row>
    </Space>
  );
}
