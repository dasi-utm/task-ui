import { create } from 'zustand';
import { analyticsService } from '../services/api';
import type { TaskMetrics, TrendPoint, PerformanceMetrics } from '../types/analytics';

interface AnalyticsState {
  metrics: TaskMetrics | null;
  trends: TrendPoint[];
  performance: PerformanceMetrics | null;
  isLoading: boolean;
  error: string | null;
  trendHours: number;
  fetchAll: (hours?: number) => Promise<void>;
  setTrendHours: (hours: number) => void;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  metrics: null,
  trends: [],
  performance: null,
  isLoading: false,
  error: null,
  trendHours: 24,

  fetchAll: async (hours?: number) => {
    const h = hours ?? get().trendHours;
    set({ isLoading: true, error: null });
    try {
      const [metrics, trends, performance] = await Promise.all([
        analyticsService.getMetrics(),
        analyticsService.getTrends(h),
        analyticsService.getPerformance(),
      ]);
      set({ metrics, trends, performance, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      set({ error: msg, isLoading: false });
    }
  },

  setTrendHours: (hours) => {
    set({ trendHours: hours });
    get().fetchAll(hours);
  },

  clearError: () => set({ error: null }),
}));
