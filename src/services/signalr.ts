import type { TaskDto } from '../types/task';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type TaskCreatedCallback = (task: TaskDto) => void;
type TaskUpdatedCallback = (task: TaskDto) => void;
type TaskDeletedCallback = (taskId: string) => void;
type TaskStatusChangedCallback = (taskId: string, newStatus: string) => void;
type StatusChangeCallback = (status: ConnectionStatus) => void;

interface WsMessage {
  type: string;
  payload: unknown;
}

let ws: WebSocket | null = null;
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

let onTaskCreated: TaskCreatedCallback | null = null;
let onTaskUpdated: TaskUpdatedCallback | null = null;
let onTaskDeleted: TaskDeletedCallback | null = null;
let onTaskStatusChanged: TaskStatusChangedCallback | null = null;
let onStatusChange: StatusChangeCallback | null = null;

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

export function getRetryDelay(count: number): number {
  return Math.min(1000 * Math.pow(2, count), 30000);
}

function handleMessage(msg: WsMessage): void {
  switch (msg.type) {
    case 'TaskCreated':
      onTaskCreated?.(msg.payload as TaskDto);
      break;
    case 'TaskUpdated':
      onTaskUpdated?.(msg.payload as TaskDto);
      break;
    case 'TaskDeleted':
      onTaskDeleted?.(msg.payload as string);
      break;
    case 'TaskStatusChanged': {
      const p = msg.payload as { taskId: string; newStatus: string };
      onTaskStatusChanged?.(p.taskId, p.newStatus);
      break;
    }
  }
}

function connect(): void {
  const base = import.meta.env.VITE_SIGNALR_URL ?? '/hubs/tasks';
  const token = getToken();
  const url = token ? `${base}?access_token=${encodeURIComponent(token)}` : base;

  onStatusChange?.(retryCount === 0 ? 'connecting' : 'reconnecting');

  ws = new WebSocket(url);

  ws.onopen = () => {
    retryCount = 0;
    onStatusChange?.('connected');
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg: WsMessage = JSON.parse(event.data as string);
      handleMessage(msg);
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    ws = null;
    if (stopped) {
      onStatusChange?.('disconnected');
      return;
    }
    const delay = getRetryDelay(retryCount);
    retryCount += 1;
    onStatusChange?.('reconnecting');
    retryTimer = setTimeout(() => connect(), delay);
  };
}

export function startConnection(): void {
  stopped = false;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }
  connect();
}

export async function stopConnection(): Promise<void> {
  stopped = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  onStatusChange?.('disconnected');
}

export function getConnectionStatus(): ConnectionStatus {
  if (!ws) return 'disconnected';
  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    default:
      return 'disconnected';
  }
}

export function registerCallbacks(callbacks: {
  onTaskCreated?: TaskCreatedCallback;
  onTaskUpdated?: TaskUpdatedCallback;
  onTaskDeleted?: TaskDeletedCallback;
  onTaskStatusChanged?: TaskStatusChangedCallback;
  onStatusChange?: StatusChangeCallback;
}): void {
  onTaskCreated = callbacks.onTaskCreated ?? null;
  onTaskUpdated = callbacks.onTaskUpdated ?? null;
  onTaskDeleted = callbacks.onTaskDeleted ?? null;
  onTaskStatusChanged = callbacks.onTaskStatusChanged ?? null;
  onStatusChange = callbacks.onStatusChange ?? null;
}

/** Reset all module-level state — for use in tests only. */
export function _resetForTesting(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  ws = null;
  retryCount = 0;
  stopped = false;
  onTaskCreated = null;
  onTaskUpdated = null;
  onTaskDeleted = null;
  onTaskStatusChanged = null;
  onStatusChange = null;
}
