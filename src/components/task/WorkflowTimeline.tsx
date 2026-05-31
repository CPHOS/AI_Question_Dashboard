import { useMemo } from 'react';
import { Badge, Collapse, Divider, Empty, Steps, Tag, Typography } from 'antd';
import {
  CheckCircleTwoTone,
  LoadingOutlined,
  ClockCircleOutlined,
  CloseCircleTwoTone,
  RedoOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PhaseOutput, ProgressEvent, TaskProgress } from '@/api/types';
import { PHASE_ORDER, isTerminal } from '@/utils/phase';
import { formatDateTime } from '@/utils/format';
import PhaseOutputCard from './PhaseOutputCard';

interface Props {
  progress?: TaskProgress;
  taskStatus?: string;
}

/**
 * One logical phase occurrence: the backend emits a `running` event (no output)
 * immediately followed by a `completed` event (with output) for the same phase,
 * each with its own incrementing seq. We pair them into a single node so a phase
 * shows up once (not twice), and the node stays "running" until its `completed`
 * arrives. Terminal phases (DONE/ABORTED/ERROR) emit only a `completed` event.
 */
interface Occurrence {
  key: number; // seq of the opening event
  phase: string;
  phaseLabel?: string;
  running: boolean;
  output?: PhaseOutput | null;
  startedAt: string;
  finishedAt?: string;
  round: number;
}

interface RoundGroup {
  round: number;
  retryKind?: string;
  occurrences: Occurrence[];
}

function arbDecision(occ: Occurrence): string | undefined {
  if (occ.output && occ.output.kind === 'arbitration') return occ.output.decision || undefined;
  return undefined;
}

function isRetry(decision?: string): boolean {
  return !!decision && decision.toUpperCase().includes('RETRY');
}

/**
 * Pair running+completed events into occurrences.
 *
 * Preferred path: group by the backend-provided `occurrence_id` (shared by the
 * running/completed pair) and use its `round` directly — no order assumptions.
 * Fallback path (older backends without those fields): pair sequential
 * running→completed events and infer rounds from arbitration retry decisions.
 */
function buildOccurrences(events: ProgressEvent[]): Occurrence[] {
  const hasOccurrenceId = events.some((e) => !!e.occurrence_id);
  return hasOccurrenceId ? buildFromOccurrenceId(events) : buildByPairing(events);
}

function buildFromOccurrenceId(events: ProgressEvent[]): Occurrence[] {
  const byId = new Map<string, Occurrence>();
  const order: string[] = [];
  for (const e of events) {
    const id = e.occurrence_id || `${e.phase}#${e.seq}`;
    let occ = byId.get(id);
    if (!occ) {
      occ = {
        key: e.seq,
        phase: e.phase,
        phaseLabel: e.phase_label,
        running: true,
        startedAt: e.created_at,
        round: e.round ?? 1,
      };
      byId.set(id, occ);
      order.push(id);
    }
    occ.phaseLabel = occ.phaseLabel || e.phase_label;
    if (e.round != null) occ.round = e.round;
    if (e.status === 'completed') {
      occ.running = false;
      occ.output = e.output;
      occ.finishedAt = e.created_at;
    } else {
      occ.startedAt = e.created_at;
    }
  }
  return order.map((id) => byId.get(id)!);
}

function buildByPairing(events: ProgressEvent[]): Occurrence[] {
  const occs: Occurrence[] = [];
  let pending: Occurrence | null = null;

  for (const e of events) {
    if (e.status === 'running') {
      if (pending) occs.push(pending); // defensive: unmatched previous running
      pending = {
        key: e.seq,
        phase: e.phase,
        phaseLabel: e.phase_label,
        running: true,
        startedAt: e.created_at,
        round: 1,
      };
    } else {
      // completed
      if (pending && pending.phase === e.phase) {
        pending.running = false;
        pending.output = e.output;
        pending.finishedAt = e.created_at;
        pending.phaseLabel = pending.phaseLabel || e.phase_label;
        occs.push(pending);
        pending = null;
      } else {
        if (pending) {
          occs.push(pending);
          pending = null;
        }
        occs.push({
          key: e.seq,
          phase: e.phase,
          phaseLabel: e.phase_label,
          running: false,
          output: e.output,
          startedAt: e.created_at,
          finishedAt: e.created_at,
          round: 1,
        });
      }
    }
  }
  if (pending) occs.push(pending);

  // Assign rounds: a new round starts after an arbitration that asks for a retry.
  let round = 1;
  for (const occ of occs) {
    occ.round = round;
    if (occ.phase === 'ARBITRATING' && isRetry(arbDecision(occ))) round += 1;
  }
  return occs;
}

function groupByRound(occs: Occurrence[]): RoundGroup[] {
  const groups: RoundGroup[] = [];
  for (const occ of occs) {
    let g = groups.find((x) => x.round === occ.round);
    if (!g) {
      g = { round: occ.round, occurrences: [] };
      groups.push(g);
    }
    g.occurrences.push(occ);
    if (occ.phase === 'ARBITRATING' && isRetry(arbDecision(occ))) {
      g.retryKind = arbDecision(occ);
    }
  }
  return groups;
}

export default function WorkflowTimeline({ progress, taskStatus }: Props) {
  const { t } = useTranslation();
  const events = useMemo(() => progress?.events ?? [], [progress?.events]);
  const occurrences = useMemo(() => buildOccurrences(events), [events]);
  const rounds = useMemo(() => groupByRound(occurrences), [occurrences]);

  // High-level Steps: derive per-phase reached/completed across all rounds.
  const completedPhases = useMemo(() => {
    const completed = new Set<string>();
    for (const occ of occurrences) if (!occ.running) completed.add(occ.phase);
    return completed;
  }, [occurrences]);

  const currentPhase = progress?.phase;
  const failed = taskStatus === 'error' || taskStatus === 'aborted';

  const steps = PHASE_ORDER.map((phase) => {
    const isCompleted = completedPhases.has(phase);
    const isCurrent = phase === currentPhase && !isTerminal(taskStatus);
    let status: 'finish' | 'process' | 'wait' | 'error' = 'wait';
    if (isCompleted) status = 'finish';
    else if (isCurrent) status = 'process';
    if (failed && isCurrent) status = 'error';
    return { title: t(`phase.${phase}`, { defaultValue: phase }), status };
  });

  const currentStepIndex = Math.max(0, PHASE_ORDER.findIndex((p) => p === currentPhase));

  // Default-expand the latest completed occurrence.
  const defaultActive = useMemo(() => {
    const completed = occurrences.filter((o) => !o.running);
    const last = completed[completed.length - 1];
    return last ? [String(last.key)] : [];
  }, [occurrences]);

  const stepsBlock = (
    <Steps
      size="small"
      responsive
      current={currentStepIndex}
      items={steps}
      style={{ marginBottom: 20 }}
    />
  );

  if (!occurrences.length) {
    return (
      <>
        {stepsBlock}
        <Empty description={t('phaseOutput.waiting')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </>
    );
  }

  const multiRound = rounds.length > 1;

  return (
    <>
      {stepsBlock}
      {rounds.map((group) => (
        <div key={group.round}>
          {multiRound && (
            <Divider orientation="left" style={{ margin: '8px 0 12px' }}>
              <RoundHeader group={group} />
            </Divider>
          )}
          <Collapse
            defaultActiveKey={defaultActive}
            items={group.occurrences.map((occ) => ({
              key: String(occ.key),
              label: <OccurrenceLabel occ={occ} showRound={multiRound} />,
              children:
                !occ.running && occ.output ? (
                  <PhaseOutputCard output={occ.output} />
                ) : (
                  <Typography.Text type="secondary">{t('phaseOutput.running')}</Typography.Text>
                ),
            }))}
            style={{ marginBottom: multiRound ? 8 : 0 }}
          />
        </div>
      ))}
    </>
  );
}

function RoundHeader({ group }: { group: RoundGroup }) {
  const { t } = useTranslation();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <RedoOutlined />
      <span>{t('timeline.round', { round: group.round })}</span>
      {group.retryKind && (
        <Tag color="warning" bordered={false}>
          {t(`timeline.retry.${group.retryKind}`, { defaultValue: group.retryKind })}
        </Tag>
      )}
    </span>
  );
}

function OccurrenceLabel({ occ, showRound }: { occ: Occurrence; showRound: boolean }) {
  const { t } = useTranslation();
  const label = occ.phaseLabel || t(`phase.${occ.phase}`, { defaultValue: occ.phase });
  const terminalFail = occ.phase === 'ERROR' || occ.phase === 'ABORTED';
  const icon = occ.running ? (
    <LoadingOutlined />
  ) : terminalFail ? (
    <CloseCircleTwoTone twoToneColor="#ff4d4f" />
  ) : (
    <CheckCircleTwoTone twoToneColor="#52c41a" />
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {icon}
      <span style={{ fontWeight: 500 }}>{label}</span>
      {showRound && (
        <Tag color="blue" bordered={false}>
          {t('timeline.roundShort', { round: occ.round })}
        </Tag>
      )}
      {occ.running ? (
        <Badge status="processing" text={t('phaseOutput.running')} />
      ) : null}
      <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
        <ClockCircleOutlined /> {formatDateTime(occ.finishedAt || occ.startedAt)}
      </Typography.Text>
    </div>
  );
}
