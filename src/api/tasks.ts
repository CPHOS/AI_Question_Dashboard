import { apiClient } from './client';
import type {
  ArtifactInfo,
  GenerateRequest,
  ListTaskParams,
  Page,
  TaskCancelAccepted,
  TaskCompileResult,
  TaskCreated,
  TaskListItem,
  TaskProgress,
  TaskResult,
  TaskStatus,
  UploadTaskFields,
} from './types';

/** Submit a generation task (topic / source_material). */
export async function createTask(body: GenerateRequest): Promise<TaskCreated> {
  const { data } = await apiClient.post<TaskCreated>('/api/tasks', body);
  return data;
}

/** Upload a source-material file and submit an adaptation task. */
export async function createTaskUpload(
  file: File,
  fields: UploadTaskFields,
): Promise<TaskCreated> {
  const form = new FormData();
  form.append('file', file);
  if (fields.difficulty != null) form.append('difficulty', fields.difficulty);
  if (fields.total_score != null) form.append('total_score', String(fields.total_score));
  if (fields.mode != null && fields.mode !== '') form.append('mode', fields.mode);
  if (fields.topic != null) form.append('topic', fields.topic);

  const { data } = await apiClient.post<TaskCreated>('/api/tasks/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** List the current user's tasks (paginated, newest first). */
export async function listMyTasks(params: ListTaskParams = {}): Promise<Page<TaskListItem>> {
  const { data } = await apiClient.get<Page<TaskListItem>>('/api/tasks', { params });
  return data;
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const { data } = await apiClient.get<TaskStatus>(`/api/tasks/${taskId}`);
  return data;
}

export async function getTaskProgress(taskId: string): Promise<TaskProgress> {
  const { data } = await apiClient.get<TaskProgress>(`/api/tasks/${taskId}/progress`);
  return data;
}

export async function listTaskArtifacts(taskId: string): Promise<ArtifactInfo[]> {
  const { data } = await apiClient.get<ArtifactInfo[]>(`/api/tasks/${taskId}/artifacts`);
  return data;
}

export async function getTaskResult(taskId: string): Promise<TaskResult> {
  const { data } = await apiClient.get<TaskResult>(`/api/tasks/${taskId}/result`);
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${taskId}`);
}

/** Cooperatively cancel a running or queued task. */
export async function cancelTask(taskId: string): Promise<TaskCancelAccepted> {
  const { data } = await apiClient.post<TaskCancelAccepted>(`/api/tasks/${taskId}/cancel`);
  return data;
}

/** Re-run a finished/failed/aborted task with its original inputs (new task). */
export async function retryTask(taskId: string): Promise<TaskCreated> {
  const { data } = await apiClient.post<TaskCreated>(`/api/tasks/${taskId}/retry`);
  return data;
}

/**
 * Re-compile a terminal task's `final_latex` + figure TikZ sources into a PDF
 * (no LLM call). Useful when generation ran with auto-compile disabled, or to
 * refresh the PDF. Requires the task to be terminal and have a `final_latex`
 * artifact; the backend serialises concurrent compiles per task.
 */
export async function compileTask(taskId: string): Promise<TaskCompileResult> {
  const { data } = await apiClient.post<TaskCompileResult>(`/api/tasks/${taskId}/compile`);
  return data;
}

/** Download an artifact as a Blob (carries the Authorization header). */
export async function downloadArtifact(taskId: string, name: string): Promise<Blob> {
  const { data } = await apiClient.get(`/api/tasks/${taskId}/artifacts/${name}`, {
    responseType: 'blob',
  });
  return data as Blob;
}

/** Download all task artifacts bundled as a single zip archive. */
export async function downloadArtifactsArchive(taskId: string): Promise<Blob> {
  const { data } = await apiClient.get(`/api/tasks/${taskId}/artifacts/archive`, {
    responseType: 'blob',
  });
  return data as Blob;
}
