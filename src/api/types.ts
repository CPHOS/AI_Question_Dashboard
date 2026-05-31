/**
 * TypeScript types mirrored from the backend OpenAPI spec
 * (AI_Question/docs/api/openapi.json). Keep in sync with the FastAPI schemas.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export type TaskLifecycleStatus =
  | 'queued'
  | 'running'
  | 'aborting'
  | 'done'
  | 'error'
  | 'aborted'
  | 'interrupted';

/** Status returned by the cancel endpoint. */
export type CancelStatus = 'aborting' | 'aborted';

export type GenerationMode =
  | 'topic_generation'
  | 'literature_adaptation'
  | 'idea_expansion'
  | 'problem_enrichment';

export type TokenRole = 'admin' | 'user';

export type ProgressEventStatus = 'running' | 'completed';

/** Workflow phase names emitted by the engine state machine (Phase.name). */
export type PhaseName =
  | 'INIT'
  | 'PLANNING'
  | 'PROBLEM_GENERATING'
  | 'SOLUTION_GENERATING'
  | 'REVIEWING'
  | 'ARBITRATING'
  | 'FORMATTING'
  | 'TEMPLATE_FIXING'
  | 'DONE'
  | 'ABORTED'
  | 'ERROR';

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface GenerateRequest {
  topic?: string;
  source_material?: string;
  difficulty?: string;
  total_score?: number;
  mode?: GenerationMode | null;
}

export interface UploadTaskFields {
  difficulty?: string;
  total_score?: number;
  mode?: string | null;
  topic?: string;
}

export interface CreateUserRequest {
  label?: string;
}

export interface CreateTokenRequest {
  user_id: string;
  role?: TokenRole;
  label?: string;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface MessageResponse {
  detail: string;
}

export interface TaskCreated {
  task_id: string;
  status: string;
}

export interface ArtifactInfo {
  name: string;
  filename: string;
  size: number;
}

export interface TaskListItem {
  task_id: string;
  user_id: string;
  status: TaskLifecycleStatus | string;
  mode?: string;
  topic?: string;
  total_score?: number;
  created_at?: string;
  finished_at?: string | null;
  error?: string | null;
}

export interface TaskStatus {
  task_id: string;
  user_id: string;
  status: TaskLifecycleStatus;
  phase?: string;
  mode?: string;
  topic?: string;
  total_score?: number;
  created_at?: string;
  finished_at?: string | null;
  error?: string | null;
  summary?: Record<string, unknown>;
}

// --- Phase output (discriminated union by `kind`) --------------------------

export interface ClippedText {
  text: string;
  truncated: boolean;
  length: number;
}

export interface PlanningOutput {
  kind: 'planning';
  planning_notes: ClippedText;
}

export interface ProblemOutput {
  kind: 'problem';
  title: string;
  problem_text: ClippedText;
}

export interface SolutionOutput {
  kind: 'solution';
  solution_text: ClippedText;
}

export interface ReviewItem {
  reviewer: 'math' | 'physics' | 'structure' | 'quality' | string;
  label: string;
  empty: boolean;
  opinion: ClippedText;
}

export interface ReviewOutput {
  kind: 'review';
  reviews: ReviewItem[];
}

export interface ArbitrationOutput {
  kind: 'arbitration';
  decision: string;
  error_category: string;
  reason: ClippedText;
  feedback: ClippedText;
  retry: { problem: number; solution: number; total: number };
}

export interface FormattingOutput {
  kind: 'formatting';
  block_formula_count: number;
  inline_formula_count: number;
  figure_count: number;
  final_latex_chars: number;
}

export interface TemplateFixingOutput {
  kind: 'template_fixing';
  template_report: ClippedText;
  figure_count: number;
  figure_keys: string[];
}

export interface DoneOutput {
  kind: 'done';
  title: string;
  decision: string;
  final_latex_chars: number;
}

export interface AbortedOutput {
  kind: 'aborted';
  decision: string;
  reason: ClippedText;
}

export interface GenericOutput {
  kind: 'generic';
  phase: string;
}

export interface ErrorOutput {
  kind: 'error';
  phase: string;
  message: string;
}

export type PhaseOutput =
  | PlanningOutput
  | ProblemOutput
  | SolutionOutput
  | ReviewOutput
  | ArbitrationOutput
  | FormattingOutput
  | TemplateFixingOutput
  | DoneOutput
  | AbortedOutput
  | GenericOutput
  | ErrorOutput;

export interface ProgressEvent {
  seq: number;
  phase: PhaseName | string;
  phase_label?: string;
  /** Stable id shared by the running/completed pair of one phase occurrence,
   * e.g. "REVIEWING#2" — lets the frontend pair events without relying on order. */
  occurrence_id?: string;
  /** Retry round (1-based), derived from the state machine's retry counters. */
  round?: number;
  status: ProgressEventStatus;
  output?: PhaseOutput | null;
  created_at: string;
}

export interface TaskProgress {
  task_id: string;
  status: TaskLifecycleStatus | string;
  phase?: string;
  events: ProgressEvent[];
}

export interface TaskResult {
  task_id: string;
  status: string;
  final_latex?: string;
  report?: string;
  artifacts: ArtifactInfo[];
}

/** Result of an on-demand re-compile of `final_latex` + figures to PDF. */
export interface TaskCompileResult {
  task_id: string;
  latex_compile_status?: Record<string, unknown>;
  figure_compile_status?: Record<string, unknown>;
  final_pdf_available: boolean;
}

export interface UserInfo {
  user_id: string;
  label?: string;
  created_at: string;
}

export interface TokenCreated {
  id: string;
  token: string;
  user_id: string;
  role: string;
  label?: string;
  created_at: string;
}

export interface TokenInfo {
  id: string;
  user_id: string;
  role: string;
  label?: string;
  created_at: string;
  revoked_at?: string | null;
}

export interface Pagination {
  limit?: number;
  offset?: number;
}

/** Pagination + fuzzy search + created-at ordering (users / tokens lists). */
export interface ListQueryParams extends Pagination {
  /** Fuzzy search (by user_id / label). */
  q?: string;
  /** Order by created_at. Defaults to DESC server-side. */
  order?: 'ASC' | 'DESC';
}

/** Query params for task list endpoints (with filters & sorting). */
export interface ListTaskParams extends Pagination {
  status?: string;
  mode?: string;
  q?: string;
  order?: 'ASC' | 'DESC';
}

/** Generic paginated envelope returned by list endpoints. */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Identity / system
// ---------------------------------------------------------------------------

export interface MeResponse {
  user_id: string;
  role: TokenRole;
  label?: string;
  token_id: string;
}

export interface VersionInfo {
  name: string;
  version: string;
  license: string;
}

/** Stable machine-readable error envelope returned for 4xx (except 422). */
export interface ErrorResponse {
  /** Stable code, e.g. not_found / forbidden / task_not_terminal. */
  code: string;
  /** Human-readable description. */
  detail: string;
}

export interface ComponentHealth {
  status: 'ok' | 'error';
  detail?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  components?: Record<string, ComponentHealth>;
}

export interface TaskCancelAccepted {
  task_id: string;
  status: CancelStatus;
}

// ---------------------------------------------------------------------------
// Admin: users & stats
// ---------------------------------------------------------------------------

export interface UpdateUserRequest {
  label: string;
}

export interface UserDetail {
  user_id: string;
  label?: string;
  created_at: string;
  token_count: number;
  task_count: number;
}

export interface AdminStats {
  task_total: number;
  task_status_counts: Record<string, number>;
  user_count: number;
  active_token_count: number;
  token_usage_total: number;
  api_cost_usd_total: number;
}

// ---------------------------------------------------------------------------
// Admin: LLM settings (providers, model configs, agent bindings, app settings)
// ---------------------------------------------------------------------------

export interface ProviderCreate {
  name: string;
  kind: string;
  api_key?: string;
  base_url?: string;
  timeout?: number;
  max_retries?: number;
}

export interface ProviderUpdate {
  name?: string | null;
  kind?: string | null;
  /** New API key; empty/omitted keeps the existing one. */
  api_key?: string | null;
  base_url?: string | null;
  timeout?: number | null;
  max_retries?: number | null;
}

export interface ProviderInfo {
  id: string;
  name: string;
  kind: string;
  base_url?: string;
  timeout?: number;
  max_retries?: number;
  api_key_set: boolean;
  api_key_masked?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModelConfigCreate {
  name: string;
  provider_id: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  streaming?: boolean;
}

export interface ModelConfigUpdate {
  name?: string | null;
  provider_id?: string | null;
  model?: string | null;
  temperature?: number | null;
  max_tokens?: number | null;
  streaming?: boolean | null;
}

export interface ModelConfigInfo {
  id: string;
  name: string;
  provider_id: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  streaming?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AgentBindingInfo {
  role: string;
  model_config_id?: string | null;
  updated_at?: string | null;
}

export interface AgentBindingUpdate {
  model_config_id: string;
}

export interface AppSettingsInfo {
  max_retry_count: number;
  source_material_max_chars: number;
  auto_compile_figures: boolean;
  auto_compile_latex: boolean;
  latex_compile_timeout: number;
  latex_compiler_backend: string;
  latex_service_base_url: string;
  /** Whether a remote-compile API key is currently stored. */
  latex_service_api_key_set: boolean;
  /** Masked preview of the stored API key (e.g. "****1234"); never the raw key. */
  latex_service_api_key_masked: string;
  latex_service_poll_interval: number;
  latex_service_max_wait: number;
  sse_poll_interval: number;
  sse_max_duration: number;
}

export interface AppSettingsUpdate {
  max_retry_count?: number | null;
  source_material_max_chars?: number | null;
  auto_compile_figures?: boolean | null;
  auto_compile_latex?: boolean | null;
  latex_compile_timeout?: number | null;
  latex_compiler_backend?: 'local' | 'remote' | null;
  latex_service_base_url?: string | null;
  latex_service_api_key?: string | null;
  latex_service_poll_interval?: number | null;
  latex_service_max_wait?: number | null;
  sse_poll_interval?: number | null;
  sse_max_duration?: number | null;
}

/** Registered provider kinds from the client registry. */
export interface ProviderKindsResponse {
  kinds: string[];
}

/** Metadata for a single runtime app-setting (drives admin form rendering). */
export interface AppSettingSpec {
  key: string;
  type: 'int' | 'float' | 'bool' | 'str' | string;
  min?: number | null;
  exclusiveMin?: number | null;
  /** Allowed values for enum-like string settings, if the backend provides them. */
  enum?: string[] | null;
}

/** Aggregated LLM / app-settings metadata for the admin UI. */
export interface LLMOptions {
  provider_kinds: string[];
  agent_roles: string[];
  app_settings: AppSettingSpec[];
}
