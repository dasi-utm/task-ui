import { create } from 'zustand';
import { taskService, type GetTasksParams } from '../services/api';
import type { TaskDto, CreateTaskDto, UpdateTaskDto } from '../types/task';
import type { PagedResult } from '../types/api';

interface TaskState {
  tasks: TaskDto[];
  selectedTask: TaskDto | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Filters
  statusFilter: string | undefined;
  priorityFilter: string | undefined;
  sortBy: string | undefined;
  sortDescending: boolean;

  // Actions
  fetchTasks: (params?: GetTasksParams) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (dto: CreateTaskDto) => Promise<void>;
  updateTask: (id: string, dto: UpdateTaskDto) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  changeStatus: (id: string, status: string) => Promise<void>;
  assignTask: (id: string, userId: string) => Promise<void>;

  setFilters: (filters: {
    statusFilter?: string;
    priorityFilter?: string;
    sortBy?: string;
    sortDescending?: boolean;
  }) => void;
  setPage: (page: number) => void;
  clearError: () => void;

  // Real-time updates
  addTask: (task: TaskDto) => void;
  updateTaskInList: (task: TaskDto) => void;
  removeTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  error: null,
  statusFilter: undefined,
  priorityFilter: undefined,
  sortBy: undefined,
  sortDescending: false,

  fetchTasks: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const result: PagedResult<TaskDto> = await taskService.getAll({
        page: state.page,
        pageSize: state.pageSize,
        status: state.statusFilter,
        priority: state.priorityFilter,
        sortBy: state.sortBy,
        sortDescending: state.sortDescending,
        ...params,
      });
      set({ tasks: result.data, total: result.total, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to load tasks';
      set({ error: message, isLoading: false });
    }
  },

  fetchTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.getById(id);
      set({ selectedTask: task, isLoading: false });
    } catch {
      set({ error: 'Task not found', isLoading: false });
    }
  },

  createTask: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.create(dto);
      set((state) => ({ tasks: [task, ...state.tasks], total: state.total + 1, isLoading: false }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create task';
      set({ error: message, isLoading: false });
    }
  },

  updateTask: async (id, dto) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await taskService.update(id, dto);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
        selectedTask: state.selectedTask?.id === id ? updated : state.selectedTask,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update task';
      set({ error: message, isLoading: false });
    }
  },

  deleteTask: async (id) => {
    try {
      await taskService.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        total: state.total - 1,
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to delete task';
      set({ error: message });
    }
  },

  changeStatus: async (id, status) => {
    try {
      const updated = await taskService.changeStatus(id, status);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to change status';
      set({ error: message });
    }
  },

  assignTask: async (id, userId) => {
    try {
      const updated = await taskService.assign(id, userId);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to assign task';
      set({ error: message });
    }
  },

  setFilters: (filters) => set({ ...filters, page: 1 }),
  setPage: (page) => set({ page }),
  clearError: () => set({ error: null }),

  // Real-time (SignalR) updates — deduplicate by id
  addTask: (task) =>
    set((state) => {
      if (state.tasks.some((t) => t.id === task.id)) return state;
      return { tasks: [task, ...state.tasks], total: state.total + 1 };
    }),
  updateTaskInList: (task) =>
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === task.id ? task : t)) })),
  removeTask: (taskId) =>
    set((state) => {
      if (!state.tasks.some((t) => t.id === taskId)) return state;
      return { tasks: state.tasks.filter((t) => t.id !== taskId), total: state.total - 1 };
    }),
  updateTaskStatus: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as TaskDto['status'] } : t
      ),
    })),
}));
