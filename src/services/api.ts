import axios from 'axios';
import type { PagedResult } from '../types/api';
import type { AuthResponseDto, LoginDto, RegisterDto, UserDto } from '../types/user';
import type {
  TaskDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskStatisticsDto,
  UserStatisticsDto,
  TimelineStatisticsDto,
} from '../types/task';
import type { TaskMetrics, TrendPoint, PerformanceMetrics } from '../types/analytics';

// Single gateway origin — empty string means relative paths (works with Vite proxy in dev
// and with nginx proxy in production). Override via VITE_GATEWAY_URL if the gateway lives
// on a different origin.
const GATEWAY = import.meta.env.VITE_GATEWAY_URL ?? '';

const apiClient = axios.create({
  baseURL: `${GATEWAY}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  register: async (dto: RegisterDto): Promise<UserDto> => {
    const { data } = await apiClient.post<UserDto>('/auth/register', dto);
    return data;
  },
  login: async (dto: LoginDto): Promise<AuthResponseDto> => {
    const { data } = await apiClient.post<AuthResponseDto>('/auth/login', dto);
    return data;
  },
};

// Tasks
export interface GetTasksParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export const taskService = {
  getAll: async (params?: GetTasksParams): Promise<PagedResult<TaskDto>> => {
    const { data } = await apiClient.get<PagedResult<TaskDto>>('/tasks', { params });
    return data;
  },
  getById: async (id: string): Promise<TaskDto> => {
    const { data } = await apiClient.get<TaskDto>(`/tasks/${id}`);
    return data;
  },
  create: async (dto: CreateTaskDto): Promise<TaskDto> => {
    const { data } = await apiClient.post<TaskDto>('/tasks', dto);
    return data;
  },
  update: async (id: string, dto: UpdateTaskDto): Promise<TaskDto> => {
    const { data } = await apiClient.put<TaskDto>(`/tasks/${id}`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
  changeStatus: async (id: string, status: string): Promise<TaskDto> => {
    const { data } = await apiClient.patch<TaskDto>(`/tasks/${id}/status`, { status });
    return data;
  },
  assign: async (id: string, userId: string): Promise<TaskDto> => {
    const { data } = await apiClient.patch<TaskDto>(`/tasks/${id}/assign`, { userId });
    return data;
  },
};

// Statistics
export const statisticsService = {
  getOverall: async (): Promise<TaskStatisticsDto> => {
    const { data } = await apiClient.get<TaskStatisticsDto>('/tasks/statistics');
    return data;
  },
  byUser: async (): Promise<UserStatisticsDto[]> => {
    const { data } = await apiClient.get<UserStatisticsDto[]>('/tasks/statistics/by-user');
    return data;
  },
  timeline: async (period = 'daily'): Promise<TimelineStatisticsDto[]> => {
    const { data } = await apiClient.get<TimelineStatisticsDto[]>('/tasks/statistics/timeline', {
      params: { period },
    });
    return data;
  },
};

// Admin
export const adminService = {
  getUsers: async (page = 1, pageSize = 20): Promise<PagedResult<UserDto>> => {
    const { data } = await apiClient.get<PagedResult<UserDto>>('/admin/users', {
      params: { page, pageSize },
    });
    return data;
  },
  changeRole: async (userId: string, role: string): Promise<UserDto> => {
    const { data } = await apiClient.patch<UserDto>(`/admin/users/${userId}/role`, { role });
    return data;
  },
};

// Analytics — routed through gateway: /analytics/* → task-analytics /api/analytics/*
const analyticsClient = axios.create({
  baseURL: `${GATEWAY}/analytics`,
  headers: { 'Content-Type': 'application/json' },
});

export const analyticsService = {
  getMetrics: async (): Promise<TaskMetrics> => {
    const { data } = await analyticsClient.get<TaskMetrics>('/metrics');
    return data;
  },
  getTrends: async (hours = 24): Promise<TrendPoint[]> => {
    const { data } = await analyticsClient.get<TrendPoint[]>('/trends', {
      params: { hours },
    });
    return data;
  },
  getPerformance: async (): Promise<PerformanceMetrics> => {
    const { data } = await analyticsClient.get<PerformanceMetrics>('/performance');
    return data;
  },
};

export default apiClient;
