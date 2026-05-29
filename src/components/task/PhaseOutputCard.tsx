import { Descriptions, Statistic, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { PhaseOutput } from '@/api/types';
import ClippedText from '@/components/common/ClippedText';
import ReviewPanel from './ReviewPanel';
import ArbitrationCard from './ArbitrationCard';

/** Renders the structured per-phase output snapshot based on its `kind`. */
export default function PhaseOutputCard({ output }: { output: PhaseOutput }) {
  const { t } = useTranslation();

  switch (output.kind) {
    case 'planning':
      return <ClippedText value={output.planning_notes} />;

    case 'problem':
      return (
        <div>
          {output.title && (
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {output.title}
            </Typography.Title>
          )}
          <ClippedText value={output.problem_text} />
        </div>
      );

    case 'solution':
      return <ClippedText value={output.solution_text} />;

    case 'review':
      return <ReviewPanel output={output} />;

    case 'arbitration':
      return <ArbitrationCard output={output} />;

    case 'formatting':
      return (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          }}
        >
          <Statistic title={t('phaseOutput.blockFormulas')} value={output.block_formula_count} />
          <Statistic title={t('phaseOutput.inlineFormulas')} value={output.inline_formula_count} />
          <Statistic title={t('phaseOutput.figures')} value={output.figure_count} />
          <Statistic title={t('phaseOutput.latexChars')} value={output.final_latex_chars} />
        </div>
      );

    case 'template_fixing':
      return (
        <div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('phaseOutput.figures')}>
              {output.figure_count}
              {output.figure_keys?.length ? ` (${output.figure_keys.join(', ')})` : ''}
            </Descriptions.Item>
          </Descriptions>
          <ClippedText value={output.template_report} />
        </div>
      );

    case 'done':
      return (
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t('phaseOutput.problemTitle')}>
            {output.title || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('phaseOutput.decision')}>
            {output.decision || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('phaseOutput.latexChars')}>
            {output.final_latex_chars}
          </Descriptions.Item>
        </Descriptions>
      );

    case 'aborted':
      return (
        <div>
          <Typography.Paragraph>
            {t('phaseOutput.decision')}: <strong>{output.decision || '—'}</strong>
          </Typography.Paragraph>
          <ClippedText value={output.reason} />
        </div>
      );

    case 'error':
      return <Typography.Text type="danger">{output.message}</Typography.Text>;

    default:
      return <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>;
  }
}
