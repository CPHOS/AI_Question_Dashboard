import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ClippedText as ClippedTextType } from '@/api/types';

interface Props {
  value?: ClippedTextType | null;
  emptyText?: string;
}

/** Renders a backend "clipped" text structure with a truncation hint. */
export default function ClippedText({ value, emptyText }: Props) {
  const { t } = useTranslation();
  if (!value || !value.text) {
    return <Typography.Text type="secondary">{emptyText ?? t('common.empty')}</Typography.Text>;
  }
  return (
    <div>
      <pre className="cphos-clip-text">{value.text}</pre>
      {value.truncated && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          … {t('phaseOutput.truncated', { length: value.length })}
        </Typography.Text>
      )}
    </div>
  );
}
