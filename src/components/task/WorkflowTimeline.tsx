import { useMemo } from 'react';
import { Badge, Collapse, Empty, Steps, Tag, Typography } from 'antd';
import {
  CheckCircleTwoTone,
  LoadingOutlined,
  ClockCircleOutlined,
  CloseCircleTwoTone,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProgressEvent, TaskProgress } from '@/api/types';
import { PHASE_ORDER, isTerminal } from '@/utils/phase';
import { formatDateTime } from '@/utils/format';
import PhaseOutputCard from './PhaseOutputCard';

interface Props {
  progress?: TaskProgress;
  taskStatus?: string;
}

export default function WorkflowTimeline({ progress, taskStatus }: Props) {
  const { t } = useTranslation();
  const events = useMemo(() => progress?.events ?? [], [progress?.events]);

  // High-level Steps: derive the furthest reached phase + per-phase reached/completed.
  const stepState = useMemo(() => {
    const completed = new Set<string>();
    const reached = new Set<string>();
    for (const e of events) {
      reached.add(e.phase);
      if (e.status === 'completed') completed.add(e.phase);
    }
    return { completed, reached };
  }, [events]);

  const currentPhase = progress?.phase;
  const failed = taskStatus === 'error' || taskStatus === 'aborted';

  const steps = PHASE_ORDER.map((phase) => {
    const isCompleted = stepState.completed.has(phase);
    const isCurrent = phase === currentPhase && !isTerminal(taskStatus);
    let status: 'finish' | 'process' | 'wait' | 'error' = 'wait';
    if (isCompleted) status = 'finish';
    else if (isCurrent) status = 'process';
    if (failed && isCurrent) status = 'error';
    return {
      title: t(`phase.${phase}`, { defaultValue: phase }),
      status,
    };
  });

  const currentStepIndex = Math.max(
    0,
    PHASE_ORDER.findIndex((p) => p === currentPhase),
  );

  if (!events.length) {
    return (
      <>
        <Steps
          size="small"
          direction="horizontal"
          responsive
          current={currentStepIndex}
          items={steps}
          style={{ marginBottom: 16 }}
        />
        <Empty description={t('phaseOutput.waiting')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </>
    );
  }

  return (
    <>
      <Steps
        size="small"
        responsive
        current={currentStepIndex}
        items={steps}
        style={{ marginBottom: 20 }}
      />
      <Collapse
        defaultActiveKey={collapseDefaults(events)}
        items={events.map((e) => ({
          key: String(e.seq),
          label: <EventLabel event={e} />,
          children:
            e.status === 'completed' && e.output ? (
              <PhaseOutputCard output={e.output} />
            ) : (
              <Typography.Text type="secondary">{t('phaseOutput.running')}</Typography.Text>
            ),
        }))}
      />
    </>
  );
}

function collapseDefaults(events: ProgressEvent[]): string[] {
  // Expand the latest completed event by default.
  const completed = events.filter((e) => e.status === 'completed');
  const last = completed[completed.length - 1];
  return last ? [String(last.seq)] : [];
}

function EventLabel({ event }: { event: ProgressEvent }) {
  const { t } = useTranslation();
  const label = event.phase_label || t(`phase.${event.phase}`, { defaultValue: event.phase });
  const icon =
    event.status === 'completed' ? (
      event.phase === 'ERROR' || event.phase === 'ABORTED' ? (
        <CloseCircleTwoTone twoToneColor="#ff4d4f" />
      ) : (
        <CheckCircleTwoTone twoToneColor="#52c41a" />
      )
    ) : (
      <LoadingOutlined />
    );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {icon}
      <span style={{ fontWeight: 500 }}>{label}</span>
      <Tag bordered={false}>#{event.seq}</Tag>
      {event.status === 'running' ? (
        <Badge status="processing" text={t('phaseOutput.running')} />
      ) : null}
      <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
        <ClockCircleOutlined /> {formatDateTime(event.created_at)}
      </Typography.Text>
    </div>
  );
}
