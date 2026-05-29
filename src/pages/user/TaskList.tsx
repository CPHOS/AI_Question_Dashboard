import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMyTasks } from '@/hooks/useTasks';
import TaskTable from '@/components/task/TaskTable';

export default function TaskList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useMyTasks({ limit: 200, offset: 0 });

  return (
    <Card title={t('nav.myTasks')}>
      <TaskTable
        data={data?.items}
        loading={isLoading}
        allowDelete
        onRefresh={() => refetch()}
      />
    </Card>
  );
}
