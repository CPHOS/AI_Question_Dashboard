import { Card, Empty, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ReviewOutput } from '@/api/types';
import ClippedText from '@/components/common/ClippedText';

export default function ReviewPanel({ output }: { output: ReviewOutput }) {
  const { t } = useTranslation();
  if (!output.reviews?.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      }}
    >
      {output.reviews.map((r) => (
        <Card
          key={r.reviewer}
          size="small"
          title={t(`reviewer.${r.reviewer}`, { defaultValue: r.label })}
          extra={
            r.empty ? (
              <Tag color="success">{t('phaseOutput.reviewEmpty')}</Tag>
            ) : (
              <Tag color="warning">●</Tag>
            )
          }
        >
          {r.empty ? (
            <Typography.Text type="secondary">{t('phaseOutput.reviewEmpty')}</Typography.Text>
          ) : (
            <ClippedText value={r.opinion} />
          )}
        </Card>
      ))}
    </div>
  );
}
