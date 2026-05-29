import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAllTasks } from '@/hooks/useTasks';
import TaskTable from '@/components/task/TaskTable';

export default function AdminAllTasks() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useAllTasks({ limit: 200, offset: 0 });

  return (
    <Card title={t('nav.allTasks')}>
      <TaskTable
        data={data?.items}
        loading={isLoading}
        showUser
        allowDelete
        onRefresh={() => refetch()}
      />
    </Card>
  );
}
