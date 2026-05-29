import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export default function ModeTag({ mode }: { mode?: string }) {
  const { t } = useTranslation();
  if (!mode) return <span>—</span>;
  return <Tag>{t(`mode.${mode}`, { defaultValue: mode })}</Tag>;
}
