import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTaskProgress,
  getTaskResult,
  getTaskStatus,
  listMyTasks,
  listTaskArtifacts,
} from '@/api/tasks';
import { listAllTasks, listUserTasks } from '@/api/admin';
import { streamTaskEvents } from '@/api/sse';
import { isTerminal } from '@/utils/phase';
import type { ListTaskParams, Pagination, ProgressEvent, TaskProgress } from '@/api/types';

const POLL_MS = 3000;

export function useMyTasks(params: ListTaskParams) {
  return useQuery({
    queryKey: ['my-tasks', params],
    queryFn: () => listMyTasks(params),
  });
}

export function useAllTasks(params: ListTaskParams) {
  return useQuery({
    queryKey: ['all-tasks', params],
    queryFn: () => listAllTasks(params),
  });
}

export function useUserTasks(userId: string, params: Pagination) {
  return useQuery({
    queryKey: ['user-tasks', userId, params],
    queryFn: () => listUserTasks(userId, params),
    enabled: !!userId,
  });
}

export function useTaskStatus(taskId: string, pollEnabled = true) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTaskStatus(taskId),
    enabled: !!taskId,
    refetchInterval: (query) =>
      !pollEnabled || isTerminal(query.state.data?.status) ? false : POLL_MS,
  });
}

export function useTaskProgress(taskId: string, taskStatus?: string, pollEnabled = true) {
  return useQuery({
    queryKey: ['task-progress', taskId],
    queryFn: () => getTaskProgress(taskId),
    enabled: !!taskId,
    refetchInterval: () => (!pollEnabled || isTerminal(taskStatus) ? false : POLL_MS),
  });
}

export function useTaskArtifacts(taskId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['task-artifacts', taskId],
    queryFn: () => listTaskArtifacts(taskId),
    enabled: !!taskId && enabled,
  });
}

export function useTaskResult(taskId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['task-result', taskId],
    queryFn: () => getTaskResult(taskId),
    enabled: !!taskId && enabled,
  });
}

/** Merge an incremental SSE phase event into a cached {@link TaskProgress}. */
function mergeProgressEvent(
  prev: TaskProgress | undefined,
  taskId: string,
  event: ProgressEvent,
): TaskProgress {
  const base: TaskProgress =
    prev ?? { task_id: taskId, status: 'running', phase: event.phase, events: [] };
  const events = base.events
    .filter((e) => e.seq !== event.seq)
    .concat(event)
    .sort((a, b) => a.seq - b.seq);
  return { ...base, phase: events[events.length - 1]?.phase, events };
}

/**
 * Subscribe to live task progress via SSE (`GET /api/tasks/{id}/events`).
 *
 * While connected, phase events are merged straight into the
 * `['task-progress', taskId]` query cache and the status query is refreshed
 * per phase — so the caller can disable interval polling. On any error (or
 * unsupported environment) `connected` stays/returns `false`, letting the
 * caller transparently fall back to polling.
 *
 * @returns `{ connected }` — whether a live stream is currently established.
 */
export function useTaskEvents(taskId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!taskId || !enabled) {
      setConnected(false);
      return;
    }
    let active = true;
    const close = streamTaskEvents(taskId, {
      onOpen: () => {
        if (active) setConnected(true);
      },
      onPhase: (event) => {
        queryClient.setQueryData<TaskProgress>(['task-progress', taskId], (prev) =>
          mergeProgressEvent(prev, taskId, event),
        );
        // Refresh the richer status payload (phase/summary) once per phase.
        void queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      },
      onStatus: () => {
        // Terminal frame: pull fresh status/result/artifacts then stop.
        void queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        void queryClient.invalidateQueries({ queryKey: ['task-progress', taskId] });
        void queryClient.invalidateQueries({ queryKey: ['task-artifacts', taskId] });
        void queryClient.invalidateQueries({ queryKey: ['task-result', taskId] });
        if (active) setConnected(false);
      },
      onClose: () => {
        // Server closed the stream (e.g. max duration) without a terminal
        // frame: drop the live flag so interval polling resumes.
        if (active) setConnected(false);
      },
      onError: () => {
        if (active) setConnected(false);
      },
    });
    return () => {
      active = false;
      close();
      setConnected(false);
    };
  }, [taskId, enabled, queryClient]);

  return { connected };
}
