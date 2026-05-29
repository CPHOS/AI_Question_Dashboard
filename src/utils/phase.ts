import type { TaskLifecycleStatus } from '@/api/types';

/** Canonical ordering of workflow phases for the timeline display. */
export const PHASE_ORDER = [
  'PLANNING',
  'PROBLEM_GENERATING',
  'SOLUTION_GENERATING',
  'REVIEWING',
  'ARBITRATING',
  'FORMATTING',
  'TEMPLATE_FIXING',
  'DONE',
] as const;

/** AntD status-tag color for each task lifecycle status. */
export function statusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'success';
    case 'running':
      return 'processing';
    case 'aborting':
      return 'warning';
    case 'queued':
      return 'default';
    case 'error':
      return 'error';
    case 'aborted':
      return 'warning';
    case 'interrupted':
      return 'warning';
    default:
      return 'default';
  }
}

export const TERMINAL_STATUSES: TaskLifecycleStatus[] = ['done', 'error', 'aborted', 'interrupted'];

export function isTerminal(status?: string): boolean {
  return !!status && (TERMINAL_STATUSES as string[]).includes(status);
}
