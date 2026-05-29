import { getStoredToken } from './client';
import type { ProgressEvent } from './types';

/**
 * Server-Sent Events client for `GET /api/tasks/{id}/events`.
 *
 * The endpoint requires `Authorization: Bearer <token>`, which the native
 * `EventSource` API cannot send. We therefore consume the `text/event-stream`
 * response via `fetch` + a `ReadableStream` reader and parse SSE frames by hand.
 */

export interface SseHandlers {
  /** Fired once the stream is established (HTTP 200 with a readable body). */
  onOpen?: () => void;
  /** Fired for every `event: phase` frame (incremental phase progress). */
  onPhase?: (event: ProgressEvent) => void;
  /** Fired for the terminal `event: status` frame (e.g. `done` / `deleted`). */
  onStatus?: (status: string) => void;
  /**
   * Fired when the stream ends *without* a terminal status frame — e.g. the
   * server closed it after `sse_max_duration`. Lets the caller resume polling.
   */
  onClose?: () => void;
  /** Fired on network/HTTP error or when the stream ends unexpectedly. */
  onError?: (error: unknown) => void;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

/** Parse a single SSE frame (lines separated by `\n`, fields `event:` / `data:`). */
function parseFrame(raw: string, handlers: SseHandlers): void {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of raw.split('\n')) {
    if (line === '' || line.startsWith(':')) continue; // blank or comment (`: connected`)
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).replace(/^ /, ''));
    }
  }
  if (dataLines.length === 0) return;
  let data: unknown;
  try {
    data = JSON.parse(dataLines.join('\n'));
  } catch {
    return; // ignore malformed payloads
  }
  if (event === 'phase') {
    handlers.onPhase?.(data as ProgressEvent);
  } else if (event === 'status') {
    handlers.onStatus?.((data as { status: string }).status);
  }
}

/**
 * Open an SSE stream for a task. Returns a function that aborts the stream.
 *
 * The promise body resolves silently when the stream ends; errors are surfaced
 * through `handlers.onError` (aborts triggered by the returned closer are
 * swallowed) so callers can fall back to polling.
 */
export function streamTaskEvents(taskId: string, handlers: SseHandlers): () => void {
  const controller = new AbortController();

  (async () => {
    const token = getStoredToken();
    const response = await fetch(
      `${baseURL}/api/tasks/${encodeURIComponent(taskId)}/events`,
      {
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      },
    );

    if (!response.ok || !response.body) {
      handlers.onError?.(new Error(`SSE request failed: HTTP ${response.status}`));
      return;
    }
    handlers.onOpen?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Normalise CRLF so frame splitting is consistent regardless of server.
      buffer = buffer.replace(/\r\n/g, '\n');
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        parseFrame(frame, handlers);
      }
    }
    // Stream ended on its own (no terminal frame): let the caller fall back.
    if (!controller.signal.aborted) handlers.onClose?.();
  })().catch((error) => {
    if (controller.signal.aborted) return; // intentional close, not an error
    handlers.onError?.(error);
  });

  return () => controller.abort();
}
