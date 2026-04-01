export interface TaskMetrics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  successRate: number;
  avgProcessingTimeMs: number;
}

export interface TrendPoint {
  hour: string;
  completed: number;
  failed: number;
}

export interface PerformanceMetrics {
  avgProcessingTimeByType: Record<string, number>;
  workerStats: Array<{
    worker: string;
    completed: number;
    failed: number;
    avgDurationMs: number;
  }>;
  throughputPerHour: number;
}
