import { Button, Card, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserTasks } from '@/hooks/useTasks';
import TaskTable from '@/components/task/TaskTable';

export default function AdminUserTasks() {
  const { userId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useUserTasks(userId, { limit: 200, offset: 0 });

  return (
    <Card
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/users')} />
          <span>{t('nav.allTasks')}</span>
          <Typography.Text code>{userId}</Typography.Text>
        </Space>
      }
    >
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
