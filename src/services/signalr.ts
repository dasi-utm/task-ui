import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { TaskDto } from '../types/task';

let connection: HubConnection | null = null;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type TaskCreatedCallback = (task: TaskDto) => void;
type TaskUpdatedCallback = (task: TaskDto) => void;
type TaskDeletedCallback = (taskId: string) => void;
type TaskStatusChangedCallback = (taskId: string, newStatus: string) => void;
type StatusChangeCallback = (status: ConnectionStatus) => void;

let onTaskCreated: TaskCreatedCallback | null = null;
let onTaskUpdated: TaskUpdatedCallback | null = null;
let onTaskDeleted: TaskDeletedCallback | null = null;
let onTaskStatusChanged: TaskStatusChangedCallback | null = null;
let onStatusChange: StatusChangeCallback | null = null;

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

function mapState(state: HubConnectionState): ConnectionStatus {
  switch (state) {
    case HubConnectionState.Connected:
      return 'connected';
    case HubConnectionState.Connecting:
      return 'connecting';
    case HubConnectionState.Reconnecting:
      return 'reconnecting';
    default:
      return 'disconnected';
  }
}

export async function startConnection(): Promise<void> {
  if (
    connection?.state === HubConnectionState.Connected ||
    connection?.state === HubConnectionState.Connecting ||
    connection?.state === HubConnectionState.Reconnecting
  )
    return;

  if (connection) {
    await connection.stop();
    connection = null;
  }

  const url = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:3001/hubs/tasks';

  const conn = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: getToken,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (ctx) =>
        Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000),
    })
    .configureLogging(LogLevel.None)
    .build();

  connection = conn;

  conn.on('TaskCreated', (task: TaskDto) => onTaskCreated?.(task));
  conn.on('TaskUpdated', (task: TaskDto) => onTaskUpdated?.(task));
  conn.on('TaskDeleted', (taskId: string) => onTaskDeleted?.(taskId));
  conn.on('TaskStatusChanged', (taskId: string, newStatus: string) =>
    onTaskStatusChanged?.(taskId, newStatus)
  );

  conn.onreconnecting(() => onStatusChange?.('reconnecting'));
  conn.onreconnected(() => onStatusChange?.('connected'));
  conn.onclose(() => onStatusChange?.('disconnected'));

  onStatusChange?.('connecting');

  try {
    await conn.start();
    if (connection === conn) {
      onStatusChange?.('connected');
    }
  } catch (err) {
    // Ignore abort errors from React strict mode cleanup stopping the connection
    // during negotiation — the next mount will reconnect successfully.
    if (connection !== conn) return;
    const message = err instanceof Error ? err.message : '';
    if (message.includes('stopped during negotiation')) return;
    console.error('SignalR connection failed:', err);
    onStatusChange?.('disconnected');
  }
}

export async function stopConnection(): Promise<void> {
  const conn = connection;
  connection = null;
  if (conn) {
    try {
      await conn.stop();
    } catch {
      // ignore errors during stop
    }
    onStatusChange?.('disconnected');
  }
}

export function getConnectionStatus(): ConnectionStatus {
  if (!connection) return 'disconnected';
  return mapState(connection.state);
}

export function registerCallbacks(callbacks: {
  onTaskCreated?: TaskCreatedCallback;
  onTaskUpdated?: TaskUpdatedCallback;
  onTaskDeleted?: TaskDeletedCallback;
  onTaskStatusChanged?: TaskStatusChangedCallback;
  onStatusChange?: StatusChangeCallback;
}) {
  onTaskCreated = callbacks.onTaskCreated ?? null;
  onTaskUpdated = callbacks.onTaskUpdated ?? null;
  onTaskDeleted = callbacks.onTaskDeleted ?? null;
  onTaskStatusChanged = callbacks.onTaskStatusChanged ?? null;
  onStatusChange = callbacks.onStatusChange ?? null;
}
