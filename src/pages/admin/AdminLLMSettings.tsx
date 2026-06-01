import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createModelConfig,
  createProvider,
  deleteModelConfig,
  deleteProvider,
  getAppSettings,
  getLLMOptions,
  getProviderKinds,
  listAgentBindings,
  listModelConfigs,
  listProviders,
  setAgentBinding,
  updateAppSettings,
  updateModelConfig,
  updateProvider,
} from '@/api/admin';
import { extractErrorMessage } from '@/api/client';
import type {
  AgentBindingInfo,
  ModelConfigCreate,
  ModelConfigInfo,
  ProviderCreate,
  ProviderInfo,
} from '@/api/types';
import { formatDateTime } from '@/utils/format';

// ---------------------------------------------------------------------------
// Providers tab
// ---------------------------------------------------------------------------

function ProvidersTab() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProviderInfo | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => listProviders({ limit: 200 }),
  });

  const { data: kindsData } = useQuery({
    queryKey: ['llm-provider-kinds'],
    queryFn: getProviderKinds,
    staleTime: 5 * 60_000,
  });
  const kindOptions = (kindsData?.kinds ?? []).map((k) => ({ value: k, label: k }));

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
    form.resetFields();
  };

  const saveMutation = useMutation({
    mutationFn: (v: ProviderCreate) =>
      editing ? updateProvider(editing.id, v) : createProvider(v),
    onSuccess: () => {
      message.success(t('common.saved'));
      closeModal();
      qc.invalidateQueries({ queryKey: ['llm-providers'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      message.success(t('common.deleted'));
      qc.invalidateQueries({ queryKey: ['llm-providers'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const openEdit = (p: ProviderInfo) => {
    setEditing(p);
    setCreating(false);
    form.setFieldsValue({
      name: p.name,
      kind: p.kind,
      base_url: p.base_url,
      proxy: p.proxy,
      timeout: p.timeout,
      max_retries: p.max_retries,
      api_key: '',
    });
  };

  const columns: ColumnsType<ProviderInfo> = [
    { title: t('llm.name'), dataIndex: 'name' },
    { title: t('llm.kind'), dataIndex: 'kind', render: (v: string) => <Tag>{v}</Tag> },
    { title: t('llm.baseUrl'), dataIndex: 'base_url', ellipsis: true, render: (v: string) => v || '—' },
    { title: t('llm.proxy'), dataIndex: 'proxy', ellipsis: true, render: (v: string) => v || '—' },
    {
      title: t('llm.apiKey'),
      dataIndex: 'api_key_set',
      width: 140,
      render: (set: boolean, r) =>
        set ? <Tag color="green">{r.api_key_masked || '••••'}</Tag> : <Tag>{t('llm.notSet')}</Tag>,
    },
    { title: t('llm.timeout'), dataIndex: 'timeout', width: 90 },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title={t('llm.deleteProviderConfirm')}
            onConfirm={() => deleteMutation.mutate(r.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCreating(true);
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ timeout: 600, max_retries: 3 });
          }}
        >
          {t('llm.addProvider')}
        </Button>
      </Space>
      <Table<ProviderInfo>
        rowKey="id"
        size="middle"
        loading={isLoading}
        dataSource={data?.items}
        columns={columns}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? t('llm.editProvider') : t('llm.addProvider')}
        open={creating || !!editing}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Form.Item
            name="name"
            label={t('llm.name')}
            rules={[{ required: true, message: t('llm.name') }]}
          >
            <Input placeholder="default" />
          </Form.Item>
          <Form.Item
            name="kind"
            label={t('llm.kind')}
            rules={[{ required: true, message: t('llm.kind') }]}
          >
            <Select
              placeholder="openrouter / openai_compatible"
              options={kindOptions}
            />
          </Form.Item>
          <Form.Item name="api_key" label={t('llm.apiKey')} extra={editing ? t('llm.apiKeyKeep') : undefined}>
            <Input.Password placeholder={editing ? '••••••' : 'sk-…'} />
          </Form.Item>
          <Form.Item name="base_url" label={t('llm.baseUrl')}>
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item name="proxy" label={t('llm.proxy')}>
            <Input placeholder="http://mihomo:7890" />
          </Form.Item>
          <Space>
            <Form.Item name="timeout" label={t('llm.timeout')}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="max_retries" label={t('llm.maxRetries')}>
              <InputNumber min={0} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Models tab
// ---------------------------------------------------------------------------

function ModelsTab() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ModelConfigInfo | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['llm-models'],
    queryFn: () => listModelConfigs({ limit: 200 }),
  });
  const { data: providers } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => listProviders({ limit: 200 }),
  });

  const providerOptions = (providers?.items ?? []).map((p) => ({ value: p.id, label: p.name }));
  const providerName = (id: string) =>
    providers?.items.find((p) => p.id === id)?.name ?? id;

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
    form.resetFields();
  };

  const saveMutation = useMutation({
    mutationFn: (v: ModelConfigCreate) =>
      editing ? updateModelConfig(editing.id, v) : createModelConfig(v),
    onSuccess: () => {
      message.success(t('common.saved'));
      closeModal();
      qc.invalidateQueries({ queryKey: ['llm-models'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModelConfig,
    onSuccess: () => {
      message.success(t('common.deleted'));
      qc.invalidateQueries({ queryKey: ['llm-models'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const openEdit = (m: ModelConfigInfo) => {
    setEditing(m);
    setCreating(false);
    form.setFieldsValue(m);
  };

  const columns: ColumnsType<ModelConfigInfo> = [
    { title: t('llm.name'), dataIndex: 'name' },
    { title: t('llm.provider'), dataIndex: 'provider_id', render: (v: string) => providerName(v) },
    { title: t('llm.model'), dataIndex: 'model', render: (v: string) => v || '—' },
    { title: t('llm.temperature'), dataIndex: 'temperature', width: 110 },
    { title: t('llm.maxTokens'), dataIndex: 'max_tokens', width: 110 },
    {
      title: t('llm.streaming'),
      dataIndex: 'streaming',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="blue">on</Tag> : <Tag>off</Tag>),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title={t('llm.deleteModelConfirm')}
            onConfirm={() => deleteMutation.mutate(r.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCreating(true);
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ temperature: 0, max_tokens: 4096, streaming: false });
          }}
        >
          {t('llm.addModel')}
        </Button>
      </Space>
      <Table<ModelConfigInfo>
        rowKey="id"
        size="middle"
        loading={isLoading}
        dataSource={data?.items}
        columns={columns}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? t('llm.editModel') : t('llm.addModel')}
        open={creating || !!editing}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Form.Item
            name="name"
            label={t('llm.name')}
            rules={[{ required: true, message: t('llm.name') }]}
          >
            <Input placeholder="big-default" />
          </Form.Item>
          <Form.Item
            name="provider_id"
            label={t('llm.provider')}
            rules={[{ required: true, message: t('llm.provider') }]}
          >
            <Select options={providerOptions} placeholder={t('llm.provider')} />
          </Form.Item>
          <Form.Item name="model" label={t('llm.model')}>
            <Input placeholder="google/gemini-2.5-pro" />
          </Form.Item>
          <Space>
            <Form.Item name="temperature" label={t('llm.temperature')}>
              <InputNumber min={0} max={2} step={0.1} />
            </Form.Item>
            <Form.Item name="max_tokens" label={t('llm.maxTokens')}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="streaming" label={t('llm.streaming')} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Agent bindings tab
// ---------------------------------------------------------------------------

function AgentsTab() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['llm-agents'],
    queryFn: listAgentBindings,
  });
  const { data: models } = useQuery({
    queryKey: ['llm-models'],
    queryFn: () => listModelConfigs({ limit: 200 }),
  });

  const modelOptions = (models?.items ?? []).map((m) => ({ value: m.id, label: m.name }));

  const bindMutation = useMutation({
    mutationFn: (v: { role: string; model_config_id: string }) =>
      setAgentBinding(v.role, { model_config_id: v.model_config_id }),
    onSuccess: () => {
      message.success(t('common.saved'));
      qc.invalidateQueries({ queryKey: ['llm-agents'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const columns: ColumnsType<AgentBindingInfo> = [
    { title: t('llm.agentRole'), dataIndex: 'role', render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
    {
      title: t('llm.boundModel'),
      dataIndex: 'model_config_id',
      render: (v: string | null, r) => (
        <Select
          style={{ minWidth: 220 }}
          value={v ?? undefined}
          placeholder={t('llm.selectModel')}
          options={modelOptions}
          onChange={(val) => bindMutation.mutate({ role: r.role, model_config_id: val })}
        />
      ),
    },
    {
      title: t('llm.updatedAt'),
      dataIndex: 'updated_at',
      width: 180,
      render: (v: string | null) => (v ? formatDateTime(v) : '—'),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
      </Space>
      <Table<AgentBindingInfo>
        rowKey="role"
        size="middle"
        loading={isLoading}
        dataSource={data}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// App settings tab
// ---------------------------------------------------------------------------

/**
 * Fallback enum choices for string settings whose spec doesn't carry an
 * explicit `enum` (the backend currently types these as plain `str`).
 */
const SETTING_ENUMS: Record<string, string[]> = {
  latex_compiler_backend: ['local', 'remote'],
};

function AppSettingsTab() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  });

  const { data: options } = useQuery({
    queryKey: ['llm-options'],
    queryFn: getLLMOptions,
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      message.success(t('common.saved'));
      qc.invalidateQueries({ queryKey: ['app-settings'] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  const specs = options?.app_settings ?? [];

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ maxWidth: 480 }}
      initialValues={data}
      key={data ? 'loaded' : 'loading'}
      onFinish={(v) => mutation.mutate(v)}
    >
      {specs.map((spec) => {
        const label = t(`settings.${spec.key}`, { defaultValue: spec.key });
        if (spec.type === 'bool') {
          return (
            <Form.Item key={spec.key} name={spec.key} label={label} valuePropName="checked">
              <Switch />
            </Form.Item>
          );
        }
        if (spec.type === 'int' || spec.type === 'float') {
          const isFloat = spec.type === 'float';
          const min = spec.exclusiveMin != null ? spec.exclusiveMin : spec.min ?? undefined;
          return (
            <Form.Item key={spec.key} name={spec.key} label={label}>
              <InputNumber min={min} step={isFloat ? 0.1 : 1} style={{ width: '100%' }} />
            </Form.Item>
          );
        }
        // Enum-like string settings render as a Select (backend-provided enum,
        // or a known fallback such as the LaTeX compiler backend toggle).
        const choices = spec.enum ?? SETTING_ENUMS[spec.key];
        if (choices?.length) {
          return (
            <Form.Item key={spec.key} name={spec.key} label={label}>
              <Select
                options={choices.map((c) => ({
                  value: c,
                  label: t(`settings.enum.${c}`, { defaultValue: c }),
                }))}
              />
            </Form.Item>
          );
        }
        // Secret string settings: never echo the stored key; show a masked hint
        // and only send a new value when the admin types one.
        const isSecret = /(api_key|secret|token|password)/i.test(spec.key);
        if (isSecret) {
          const masked = (data as Record<string, unknown> | undefined)?.[`${spec.key}_masked`];
          return (
            <Form.Item
              key={spec.key}
              name={spec.key}
              label={label}
              extra={t('settings.secretHint')}
            >
              <Input.Password
                autoComplete="off"
                placeholder={typeof masked === 'string' && masked ? masked : undefined}
              />
            </Form.Item>
          );
        }
        // Plain string settings (e.g. latex_service_base_url) — text input.
        return (
          <Form.Item key={spec.key} name={spec.key} label={label}>
            <Input />
          </Form.Item>
        );
      })}
      <Button
        type="primary"
        htmlType="submit"
        loading={mutation.isPending}
        disabled={isLoading || specs.length === 0}
      >
        {t('common.save')}
      </Button>
    </Form>
  );
}

export default function AdminLLMSettings() {
  const { t } = useTranslation();
  return (
    <Card title={t('nav.llmSettings')}>
      <Tabs
        items={[
          { key: 'providers', label: t('llm.providers'), children: <ProvidersTab /> },
          { key: 'models', label: t('llm.models'), children: <ModelsTab /> },
          { key: 'agents', label: t('llm.agents'), children: <AgentsTab /> },
          { key: 'settings', label: t('llm.appSettings'), children: <AppSettingsTab /> },
        ]}
      />
    </Card>
  );
}
