export interface TaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CreateTaskDto {
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
}

export interface UpdateTaskDto {
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
}

export interface ChangeStatusDto {
  status: string;
}

export interface AssignTaskDto {
  userId: string;
}

export interface TaskStatisticsDto {
  totalTasks: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdueCount: number;
}

export interface UserStatisticsDto {
  userId: string;
  name: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  completionRate: number;
}

export interface TimelineStatisticsDto {
  period: string;
  created: number;
  completed: number;
}
