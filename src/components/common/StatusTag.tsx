import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { statusColor } from '@/utils/phase';

export default function StatusTag({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = t(`status.${status}`, { defaultValue: status });
  return <Tag color={statusColor(status)}>{label}</Tag>;
}
