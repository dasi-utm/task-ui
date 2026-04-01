import { HubConnectionBuilder, HubConnection, HubConnectionState } from '@microsoft/signalr';
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
  if (connection?.state === HubConnectionState.Connected) return;

  const url = `${import.meta.env.VITE_SIGNALR_URL ?? '/hubs/tasks'}`;

  connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: getToken,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (ctx) =>
        Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000),
    })
    .build();

  connection.on('TaskCreated', (task: TaskDto) => onTaskCreated?.(task));
  connection.on('TaskUpdated', (task: TaskDto) => onTaskUpdated?.(task));
  connection.on('TaskDeleted', (taskId: string) => onTaskDeleted?.(taskId));
  connection.on('TaskStatusChanged', (taskId: string, newStatus: string) =>
    onTaskStatusChanged?.(taskId, newStatus)
  );

  connection.onreconnecting(() => onStatusChange?.('reconnecting'));
  connection.onreconnected(() => onStatusChange?.('connected'));
  connection.onclose(() => onStatusChange?.('disconnected'));

  onStatusChange?.('connecting');

  try {
    await connection.start();
    onStatusChange?.('connected');
  } catch (err) {
    console.error('SignalR connection failed:', err);
    onStatusChange?.('disconnected');
  }
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
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
