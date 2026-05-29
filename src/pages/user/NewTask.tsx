import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
  Tabs,
  Upload,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, createTaskUpload } from '@/api/tasks';
import { extractErrorMessage } from '@/api/client';
import type { GenerationMode } from '@/api/types';

const MODES: GenerationMode[] = [
  'topic_generation',
  'literature_adaptation',
  'idea_expansion',
  'problem_enrichment',
];

export default function NewTask() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [textForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onSuccess = (taskId: string) => {
    message.success(t('task.submitted'));
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    navigate(`/tasks/${taskId}`);
  };

  const textMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (d) => onSuccess(d.task_id),
    onError: (e) => message.error(extractErrorMessage(e, t('task.submitFailed'))),
  });

  const uploadMutation = useMutation({
    mutationFn: (vars: { file: File; fields: any }) => createTaskUpload(vars.file, vars.fields),
    onSuccess: (d) => onSuccess(d.task_id),
    onError: (e) => message.error(extractErrorMessage(e, t('task.submitFailed'))),
  });

  const modeOptions = [
    { value: '', label: t('task.modeAuto') },
    ...MODES.map((m) => ({ value: m, label: t(`mode.${m}`) })),
  ];

  const textTab = (
    <Form
      form={textForm}
      layout="vertical"
      initialValues={{ difficulty: '国家集训队', total_score: 40, mode: '' }}
      onFinish={(v) =>
        textMutation.mutate({
          topic: v.topic || '',
          source_material: v.source_material || '',
          difficulty: v.difficulty,
          total_score: v.total_score,
          mode: v.mode || null,
        })
      }
    >
      <Form.Item name="topic" label={t('task.topic')}>
        <Input placeholder={t('task.topicPlaceholder')} />
      </Form.Item>
      <Form.Item name="source_material" label={`${t('task.sourceMaterial')} (${t('common.optional')})`}>
        <Input.TextArea
          rows={5}
          placeholder={t('task.sourceMaterialPlaceholder')}
        />
      </Form.Item>
      <Form.Item name="mode" label={t('task.mode')}>
        <Select options={modeOptions} />
      </Form.Item>
      <Form.Item name="difficulty" label={t('task.difficulty')}>
        <Input />
      </Form.Item>
      <Form.Item name="total_score" label={t('task.totalScore')} extra={t('task.scoreRange')}>
        <Slider
          min={20}
          max={80}
          marks={{ 20: '20', 40: '40', 60: '60', 80: '80' }}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={textMutation.isPending}>
        {t('task.submitTask')}
      </Button>
    </Form>
  );

  const uploadTab = (
    <Form
      form={uploadForm}
      layout="vertical"
      initialValues={{ difficulty: '国家集训队', total_score: 40, mode: '', topic: '' }}
      onFinish={(v) => {
        const file = fileList[0]?.originFileObj as File | undefined;
        if (!file) {
          message.warning(t('task.uploadFile'));
          return;
        }
        uploadMutation.mutate({
          file,
          fields: {
            difficulty: v.difficulty,
            total_score: v.total_score,
            mode: v.mode || null,
            topic: v.topic || '',
          },
        });
      }}
    >
      <Form.Item label={t('task.uploadFile')} required>
        <Upload.Dragger
          beforeUpload={() => false}
          maxCount={1}
          fileList={fileList}
          onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
          accept=".txt,.md,.tex,.json"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{t('task.uploadHint')}</p>
        </Upload.Dragger>
      </Form.Item>
      <Form.Item name="topic" label={`${t('task.topic')} (${t('common.optional')})`}>
        <Input placeholder={t('task.topicPlaceholder')} />
      </Form.Item>
      <Form.Item name="mode" label={t('task.mode')}>
        <Select options={modeOptions} />
      </Form.Item>
      <Form.Item name="difficulty" label={t('task.difficulty')}>
        <Input />
      </Form.Item>
      <Form.Item name="total_score" label={t('task.totalScore')} extra={t('task.scoreRange')}>
        <InputNumber min={20} max={80} style={{ width: '100%' }} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={uploadMutation.isPending}>
        {t('task.submitTask')}
      </Button>
    </Form>
  );

  return (
    <Card title={t('nav.newTask')} style={{ maxWidth: 760, margin: '0 auto' }}>
      <Tabs
        items={[
          { key: 'text', label: t('task.formTab'), children: textTab },
          { key: 'upload', label: t('task.uploadTab'), children: uploadTab },
        ]}
      />
    </Card>
  );
}
