import { Descriptions, Space, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ArbitrationOutput } from '@/api/types';
import ClippedText from '@/components/common/ClippedText';

function decisionColor(decision: string): string {
  const d = decision.toLowerCase();
  if (d.includes('pass') || d.includes('accept') || d.includes('通过')) return 'success';
  if (d.includes('abort') || d.includes('终止')) return 'error';
  if (d.includes('retry') || d.includes('重试')) return 'warning';
  return 'default';
}

export default function ArbitrationCard({ output }: { output: ArbitrationOutput }) {
  const { t } = useTranslation();
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        {output.decision && (
          <Tag color={decisionColor(output.decision)} style={{ fontSize: 13 }}>
            {t('phaseOutput.decision')}: {output.decision}
          </Tag>
        )}
        {output.error_category && (
          <Tag>
            {t('phaseOutput.errorCategory')}: {output.error_category}
          </Tag>
        )}
        <Tag color="blue">
          {t('phaseOutput.retryProblem')}: {output.retry.problem}
        </Tag>
        <Tag color="blue">
          {t('phaseOutput.retrySolution')}: {output.retry.solution}
        </Tag>
        <Tag>
          {t('phaseOutput.retryTotal')}: {output.retry.total}
        </Tag>
      </Space>
      {(output.reason?.text || output.feedback?.text) && (
        <Descriptions column={1} size="small" bordered>
          {output.reason?.text && (
            <Descriptions.Item label={t('phaseOutput.reason')}>
              <ClippedText value={output.reason} />
            </Descriptions.Item>
          )}
          {output.feedback?.text && (
            <Descriptions.Item label={t('phaseOutput.feedback')}>
              <ClippedText value={output.feedback} />
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
      {!output.decision && !output.reason?.text && (
        <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>
      )}
    </Space>
  );
}
