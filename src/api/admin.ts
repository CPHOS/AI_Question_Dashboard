import { apiClient } from './client';
import type {
  AdminStats,
  AgentBindingInfo,
  AgentBindingUpdate,
  AppSettingsInfo,
  AppSettingsUpdate,
  CreateTokenRequest,
  CreateUserRequest,
  ListTaskParams,
  LLMOptions,
  ListQueryParams,
  MeResponse,
  ModelConfigCreate,
  ModelConfigInfo,
  ModelConfigUpdate,
  Page,
  Pagination,
  ProviderCreate,
  ProviderInfo,
  ProviderKindsResponse,
  ProviderUpdate,
  TaskListItem,
  TokenCreated,
  TokenInfo,
  UpdateUserRequest,
  UserDetail,
  UserInfo,
} from './types';

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** Return the current token's identity & role. Any valid token may call this. */
export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/api/me');
  return data;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function listUsers(params: ListQueryParams = {}): Promise<Page<UserInfo>> {
  const { data } = await apiClient.get<Page<UserInfo>>('/api/admin/users', { params });
  return data;
}

export async function createUser(body: CreateUserRequest): Promise<UserInfo> {
  const { data } = await apiClient.post<UserInfo>('/api/admin/users', body);
  return data;
}

export async function getUser(userId: string): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetail>(`/api/admin/users/${userId}`);
  return data;
}

export async function updateUser(userId: string, body: UpdateUserRequest): Promise<UserInfo> {
  const { data } = await apiClient.patch<UserInfo>(`/api/admin/users/${userId}`, body);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`);
}

export async function listUserTasks(
  userId: string,
  params: Pagination = {},
): Promise<Page<TaskListItem>> {
  const { data } = await apiClient.get<Page<TaskListItem>>(`/api/admin/users/${userId}/tasks`, {
    params,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

export async function createToken(body: CreateTokenRequest): Promise<TokenCreated> {
  const { data } = await apiClient.post<TokenCreated>('/api/admin/tokens', body);
  return data;
}

export async function listTokens(
  userId?: string,
  params: ListQueryParams = {},
): Promise<Page<TokenInfo>> {
  const { data } = await apiClient.get<Page<TokenInfo>>('/api/admin/tokens', {
    params: { ...params, ...(userId ? { user_id: userId } : {}) },
  });
  return data;
}

export async function revokeToken(tokenId: string): Promise<void> {
  await apiClient.delete(`/api/admin/tokens/${tokenId}`);
}

// ---------------------------------------------------------------------------
// Tasks & stats
// ---------------------------------------------------------------------------

export async function listAllTasks(params: ListTaskParams = {}): Promise<Page<TaskListItem>> {
  const { data } = await apiClient.get<Page<TaskListItem>>('/api/admin/tasks', { params });
  return data;
}

export async function getStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/api/admin/stats');
  return data;
}

// ---------------------------------------------------------------------------
// LLM settings: providers
// ---------------------------------------------------------------------------

/** Registered provider kinds (drives the provider-kind dropdown). */
export async function getProviderKinds(): Promise<ProviderKindsResponse> {
  const { data } = await apiClient.get<ProviderKindsResponse>('/api/admin/llm/provider-kinds');
  return data;
}

/** Aggregated LLM / app-settings metadata for admin forms. */
export async function getLLMOptions(): Promise<LLMOptions> {
  const { data } = await apiClient.get<LLMOptions>('/api/admin/llm/options');
  return data;
}

export async function listProviders(params: Pagination = {}): Promise<Page<ProviderInfo>> {
  const { data } = await apiClient.get<Page<ProviderInfo>>('/api/admin/llm/providers', { params });
  return data;
}

export async function createProvider(body: ProviderCreate): Promise<ProviderInfo> {
  const { data } = await apiClient.post<ProviderInfo>('/api/admin/llm/providers', body);
  return data;
}

export async function updateProvider(id: string, body: ProviderUpdate): Promise<ProviderInfo> {
  const { data } = await apiClient.patch<ProviderInfo>(`/api/admin/llm/providers/${id}`, body);
  return data;
}

export async function deleteProvider(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/llm/providers/${id}`);
}

// ---------------------------------------------------------------------------
// LLM settings: model configs
// ---------------------------------------------------------------------------

export async function listModelConfigs(params: Pagination = {}): Promise<Page<ModelConfigInfo>> {
  const { data } = await apiClient.get<Page<ModelConfigInfo>>('/api/admin/llm/models', { params });
  return data;
}

export async function createModelConfig(body: ModelConfigCreate): Promise<ModelConfigInfo> {
  const { data } = await apiClient.post<ModelConfigInfo>('/api/admin/llm/models', body);
  return data;
}

export async function updateModelConfig(
  id: string,
  body: ModelConfigUpdate,
): Promise<ModelConfigInfo> {
  const { data } = await apiClient.patch<ModelConfigInfo>(`/api/admin/llm/models/${id}`, body);
  return data;
}

export async function deleteModelConfig(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/llm/models/${id}`);
}

// ---------------------------------------------------------------------------
// LLM settings: agent bindings & app settings
// ---------------------------------------------------------------------------

export async function listAgentBindings(): Promise<AgentBindingInfo[]> {
  const { data } = await apiClient.get<AgentBindingInfo[]>('/api/admin/llm/agents');
  return data;
}

export async function setAgentBinding(
  role: string,
  body: AgentBindingUpdate,
): Promise<AgentBindingInfo> {
  const { data } = await apiClient.put<AgentBindingInfo>(`/api/admin/llm/agents/${role}`, body);
  return data;
}

export async function getAppSettings(): Promise<AppSettingsInfo> {
  const { data } = await apiClient.get<AppSettingsInfo>('/api/admin/llm/settings');
  return data;
}

export async function updateAppSettings(body: AppSettingsUpdate): Promise<AppSettingsInfo> {
  const { data } = await apiClient.patch<AppSettingsInfo>('/api/admin/llm/settings', body);
  return data;
}
