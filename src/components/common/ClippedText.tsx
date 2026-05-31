import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ClippedText as ClippedTextType } from '@/api/types';
import AgentOutput from './AgentOutput';

interface Props {
  value?: ClippedTextType | null;
  emptyText?: string;
  /** When false, render as plain monospace text instead of rich agent output. */
  rich?: boolean;
  compact?: boolean;
}

/** Renders a backend "clipped" text structure with a truncation hint. */
export default function ClippedText({ value, emptyText, rich = true, compact }: Props) {
  const { t } = useTranslation();
  if (!value || !value.text) {
    return <Typography.Text type="secondary">{emptyText ?? t('common.empty')}</Typography.Text>;
  }
  return (
    <div>
      {rich ? (
        <AgentOutput text={value.text} compact={compact} />
      ) : (
        <pre className="cphos-clip-text">{value.text}</pre>
      )}
      {value.truncated && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          … {t('phaseOutput.truncated', { length: value.length })}
        </Typography.Text>
      )}
    </div>
  );
}
