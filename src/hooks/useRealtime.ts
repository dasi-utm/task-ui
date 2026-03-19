import { useEffect, useState } from 'react';
import {
  startConnection,
  stopConnection,
  registerCallbacks,
  type ConnectionStatus,
} from '../services/signalr';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';

export function useRealtime() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const token = useAuthStore((s) => s.token);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTaskInList = useTaskStore((s) => s.updateTaskInList);
  const removeTask = useTaskStore((s) => s.removeTask);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);

  useEffect(() => {
    if (!token) {
      stopConnection();
      setStatus('disconnected');
      return;
    }

    registerCallbacks({
      onTaskCreated: addTask,
      onTaskUpdated: updateTaskInList,
      onTaskDeleted: removeTask,
      onTaskStatusChanged: updateTaskStatus,
      onStatusChange: setStatus,
    });

    startConnection();

    return () => {
      stopConnection();
    };
  }, [token, addTask, updateTaskInList, removeTask, updateTaskStatus]);

  return status;
}
