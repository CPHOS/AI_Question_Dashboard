import { App as AntdApp, Button, Space, Table, Tag } from 'antd';
import { DownloadOutlined, FileZipOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ArtifactInfo } from '@/api/types';
import { downloadArtifact, downloadArtifactsArchive } from '@/api/tasks';
import { downloadBlob } from '@/utils/download';
import { formatBytes } from '@/utils/format';
import { extractErrorMessage } from '@/api/client';

interface Props {
  taskId: string;
  artifacts: ArtifactInfo[];
  loading?: boolean;
}

export default function ArtifactList({ taskId, artifacts, loading }: Props) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const handleDownload = async (a: ArtifactInfo) => {
    setDownloading(a.name);
    try {
      const blob = await downloadArtifact(taskId, a.name);
      downloadBlob(blob, a.filename || a.name);
    } catch (e) {
      message.error(extractErrorMessage(e));
    } finally {
      setDownloading(null);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const blob = await downloadArtifactsArchive(taskId);
      downloadBlob(blob, `${taskId}.zip`);
    } catch (e) {
      message.error(extractErrorMessage(e));
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Button
        icon={<FileZipOutlined />}
        loading={archiving}
        disabled={artifacts.length === 0}
        onClick={handleArchive}
      >
        {t('result.downloadZip')}
      </Button>
      <Table<ArtifactInfo>
      rowKey="name"
      size="small"
      loading={loading}
      dataSource={artifacts}
      pagination={false}
      columns={[
        {
          title: t('result.name'),
          dataIndex: 'name',
          render: (v: string) => <Tag color="blue">{v}</Tag>,
        },
        { title: t('result.filename'), dataIndex: 'filename', ellipsis: true },
        {
          title: t('result.size'),
          dataIndex: 'size',
          width: 110,
          render: (v: number) => formatBytes(v),
        },
        {
          title: t('common.actions'),
          key: 'actions',
          width: 120,
          render: (_, a) => (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              loading={downloading === a.name}
              onClick={() => handleDownload(a)}
            >
              {t('common.download')}
            </Button>
          ),
        },
      ]}
      />
    </Space>
  );
}
