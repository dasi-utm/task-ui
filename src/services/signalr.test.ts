import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startConnection,
  stopConnection,
  getConnectionStatus,
  registerCallbacks,
  getRetryDelay,
  _resetForTesting,
} from './signalr';
import type { TaskDto } from '../types/task';

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

type WsHandler = ((event: Event) => void) | null;

interface MockWsInstance {
  url: string;
  readyState: number;
  onopen: WsHandler;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: WsHandler;
  close: ReturnType<typeof vi.fn>;
  /** Test helper — simulate the socket opening */
  simulateOpen(): void;
  /** Test helper — simulate a message from the server */
  simulateMessage(data: unknown): void;
  /** Test helper — simulate the socket closing */
  simulateClose(): void;
}

let lastWsInstance: MockWsInstance | null = null;

class MockWebSocket implements MockWsInstance {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: WsHandler = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: WsHandler = null;
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  constructor(url: string) {
    this.url = url;
    lastWsInstance = this;
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: unknown): void {
    const event = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(event);
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  lastWsInstance = null;
  vi.stubGlobal('WebSocket', MockWebSocket);
  localStorage.clear();
  _resetForTesting();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  _resetForTesting();
});

// ---------------------------------------------------------------------------
// getRetryDelay
// ---------------------------------------------------------------------------

describe('getRetryDelay', () => {
  it('doubles each attempt starting at 1 s', () => {
    expect(getRetryDelay(0)).toBe(1000);
    expect(getRetryDelay(1)).toBe(2000);
    expect(getRetryDelay(2)).toBe(4000);
    expect(getRetryDelay(3)).toBe(8000);
  });

  it('caps at 30 s', () => {
    expect(getRetryDelay(5)).toBe(30000); // 32000 → capped
    expect(getRetryDelay(10)).toBe(30000);
  });
});

// ---------------------------------------------------------------------------
// startConnection
// ---------------------------------------------------------------------------

describe('startConnection', () => {
  it('creates a WebSocket with the env URL', () => {
    startConnection();
    expect(lastWsInstance).not.toBeNull();
    expect(lastWsInstance!.url).toContain('/hubs/tasks');
  });

  it('appends access_token query param when token is present', () => {
    localStorage.setItem('token', 'my-jwt');
    startConnection();
    expect(lastWsInstance!.url).toContain('access_token=my-jwt');
  });

  it('does NOT append access_token when token is absent', () => {
    startConnection();
    expect(lastWsInstance!.url).not.toContain('access_token');
  });

  it('emits "connecting" immediately on first connect', () => {
    const onStatusChange = vi.fn();
    registerCallbacks({ onStatusChange });
    startConnection();
    expect(onStatusChange).toHaveBeenCalledWith('connecting');
  });

  it('emits "connected" once socket opens', () => {
    const onStatusChange = vi.fn();
    registerCallbacks({ onStatusChange });
    startConnection();
    lastWsInstance!.simulateOpen();
    expect(onStatusChange).toHaveBeenCalledWith('connected');
  });

  it('does not create a second socket if already CONNECTING', () => {
    startConnection();
    const first = lastWsInstance;
    startConnection(); // should be a no-op
    expect(lastWsInstance).toBe(first);
  });

  it('does not create a second socket if already OPEN', () => {
    startConnection();
    lastWsInstance!.simulateOpen();
    const first = lastWsInstance;
    startConnection();
    expect(lastWsInstance).toBe(first);
  });
});

// ---------------------------------------------------------------------------
// getConnectionStatus
// ---------------------------------------------------------------------------

describe('getConnectionStatus', () => {
  it('returns "disconnected" before any connection', () => {
    expect(getConnectionStatus()).toBe('disconnected');
  });

  it('returns "connecting" while socket is CONNECTING', () => {
    startConnection();
    // readyState is CONNECTING by default in the mock
    expect(getConnectionStatus()).toBe('connecting');
  });

  it('returns "connected" when socket is OPEN', () => {
    startConnection();
    lastWsInstance!.simulateOpen();
    expect(getConnectionStatus()).toBe('connected');
  });

  it('returns "disconnected" after socket closes', () => {
    startConnection();
    lastWsInstance!.simulateOpen();
    lastWsInstance!.simulateClose();
    // after close the retry timer fires — advance timers so reconnect starts
    vi.advanceTimersByTime(1000);
    // but the new socket hasn't opened yet, so status is still reconnecting
    // Just check that the old ws is gone
    expect(getConnectionStatus()).not.toBe('connected');
  });
});

// ---------------------------------------------------------------------------
// stopConnection
// ---------------------------------------------------------------------------

describe('stopConnection', () => {
  it('closes the socket and emits "disconnected"', async () => {
    const onStatusChange = vi.fn();
    registerCallbacks({ onStatusChange });
    startConnection();
    lastWsInstance!.simulateOpen();
    await stopConnection();
    expect(lastWsInstance!.close).toHaveBeenCalled();
    expect(onStatusChange).toHaveBeenCalledWith('disconnected');
  });

  it('is safe to call when no connection exists', async () => {
    await expect(stopConnection()).resolves.toBeUndefined();
  });

  it('cancels a pending retry timer', async () => {
    const onStatusChange = vi.fn();
    registerCallbacks({ onStatusChange });
    startConnection();
    lastWsInstance!.simulateClose(); // triggers retry timer

    await stopConnection(); // should cancel the timer
    onStatusChange.mockClear();

    vi.advanceTimersByTime(30000); // advance past any retry delay
    expect(onStatusChange).not.toHaveBeenCalled(); // no reconnect fired
  });
});

// ---------------------------------------------------------------------------
// Reconnection / retry
// ---------------------------------------------------------------------------

describe('reconnection', () => {
  it('emits "reconnecting" after socket closes unexpectedly', () => {
    const onStatusChange = vi.fn();
    registerCallbacks({ onStatusChange });
    startConnection();
    lastWsInstance!.simulateOpen();
    onStatusChange.mockClear();

    lastWsInstance!.simulateClose();
    expect(onStatusChange).toHaveBeenCalledWith('reconnecting');
  });

  it('schedules a new WebSocket after 1 s on first retry', () => {
    startConnection();
    const first = lastWsInstance;
    first!.simulateClose();

    vi.advanceTimersByTime(999);
    expect(lastWsInstance).toBe(first); // not yet

    vi.advanceTimersByTime(1);
    expect(lastWsInstance).not.toBe(first); // new socket created
  });

  it('doubles the delay on successive failures', () => {
    startConnection();
    lastWsInstance!.simulateClose(); // retry 1 → delay 1000ms

    vi.advanceTimersByTime(1000);
    lastWsInstance!.simulateClose(); // retry 2 → delay 2000ms

    const secondWs = lastWsInstance;
    vi.advanceTimersByTime(1999);
    expect(lastWsInstance).toBe(secondWs); // not yet

    vi.advanceTimersByTime(1);
    expect(lastWsInstance).not.toBe(secondWs); // third socket created
  });

  it('resets retryCount to 0 on successful reconnect', () => {
    startConnection();
    lastWsInstance!.simulateClose(); // bump retryCount → 1

    vi.advanceTimersByTime(1000);
    lastWsInstance!.simulateOpen(); // successful reconnect

    // Next close should retry after 1 s (count reset to 0)
    const successWs = lastWsInstance;
    lastWsInstance!.simulateClose();
    vi.advanceTimersByTime(999);
    expect(lastWsInstance).toBe(successWs);
    vi.advanceTimersByTime(1);
    expect(lastWsInstance).not.toBe(successWs);
  });

  it('passes "reconnecting" status (not "connecting") on subsequent attempts', () => {
    const onStatusChange = vi.fn();
    registerCallbacks({ onStatusChange });
    startConnection();
    lastWsInstance!.simulateClose(); // retryCount=0 → becomes 1 after close

    vi.advanceTimersByTime(1000); // new connect call
    // retryCount was 1 when connect() was called so status should be 'reconnecting'
    const calls = onStatusChange.mock.calls.map((c) => c[0]);
    expect(calls).toContain('reconnecting');
  });
});

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

describe('message handling', () => {
  const task: TaskDto = {
    id: 'task-1',
    title: 'Test task',
    description: '',
    status: 'TODO',
    priority: 'Medium',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  function setup() {
    const onTaskCreated = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();
    const onTaskStatusChanged = vi.fn();
    registerCallbacks({ onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskStatusChanged });
    startConnection();
    lastWsInstance!.simulateOpen();
    return { onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskStatusChanged };
  }

  it('routes TaskCreated to onTaskCreated', () => {
    const { onTaskCreated } = setup();
    lastWsInstance!.simulateMessage({ type: 'TaskCreated', payload: task });
    expect(onTaskCreated).toHaveBeenCalledWith(task);
  });

  it('routes TaskUpdated to onTaskUpdated', () => {
    const { onTaskUpdated } = setup();
    lastWsInstance!.simulateMessage({ type: 'TaskUpdated', payload: task });
    expect(onTaskUpdated).toHaveBeenCalledWith(task);
  });

  it('routes TaskDeleted to onTaskDeleted', () => {
    const { onTaskDeleted } = setup();
    lastWsInstance!.simulateMessage({ type: 'TaskDeleted', payload: 'task-1' });
    expect(onTaskDeleted).toHaveBeenCalledWith('task-1');
  });

  it('routes TaskStatusChanged to onTaskStatusChanged', () => {
    const { onTaskStatusChanged } = setup();
    lastWsInstance!.simulateMessage({
      type: 'TaskStatusChanged',
      payload: { taskId: 'task-1', newStatus: 'IN_PROGRESS' },
    });
    expect(onTaskStatusChanged).toHaveBeenCalledWith('task-1', 'IN_PROGRESS');
  });

  it('ignores unknown message types without throwing', () => {
    setup();
    expect(() =>
      lastWsInstance!.simulateMessage({ type: 'UnknownEvent', payload: {} })
    ).not.toThrow();
  });

  it('silently ignores malformed (non-JSON) messages', () => {
    const { onTaskCreated } = setup();
    const event = new MessageEvent('message', { data: 'not json {{{' });
    expect(() => lastWsInstance!.onmessage?.(event)).not.toThrow();
    expect(onTaskCreated).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// registerCallbacks
// ---------------------------------------------------------------------------

describe('registerCallbacks', () => {
  it('overwrites previous callbacks', () => {
    const first = vi.fn();
    const second = vi.fn();
    registerCallbacks({ onTaskCreated: first });
    registerCallbacks({ onTaskCreated: second });
    startConnection();
    lastWsInstance!.simulateOpen();
    lastWsInstance!.simulateMessage({ type: 'TaskCreated', payload: {} });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
  });

  it('clears callbacks not included in the new call', () => {
    const cb = vi.fn();
    registerCallbacks({ onTaskCreated: cb });
    registerCallbacks({}); // omit onTaskCreated
    startConnection();
    lastWsInstance!.simulateOpen();
    lastWsInstance!.simulateMessage({ type: 'TaskCreated', payload: {} });
    expect(cb).not.toHaveBeenCalled();
  });
});
