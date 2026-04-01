import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { useRealtime } from '../../hooks/useRealtime';
import type { CreateTaskDto, TaskPriority, TaskStatus } from '../../types/task';
import './Dashboard.css';

const STATUS_OPTIONS: TaskStatus[] = ['Pending', 'InProgress', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Pending: ['InProgress', 'Cancelled'],
  InProgress: ['Completed', 'Pending', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const {
    tasks,
    total,
    isLoading,
    error,
    fetchTasks,
    createTask,
    deleteTask,
    changeStatus,
    statusFilter,
    priorityFilter,
    setFilters,
    clearError,
  } = useTaskStore();
  const connectionStatus = useRealtime();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateTaskDto>({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: null,
  });

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, statusFilter, priorityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask(form);
    setForm({ title: '', description: '', priority: 'Medium', dueDate: null });
    setShowForm(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'Completed':
        return '#16a34a';
      case 'InProgress':
        return '#2563eb';
      case 'Cancelled':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'Critical':
        return '#dc2626';
      case 'High':
        return '#ea580c';
      case 'Medium':
        return '#ca8a04';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Task Dashboard</h1>
          <span className="connection-badge" data-status={connectionStatus}>
            {connectionStatus}
          </span>
        </div>
        <div className="header-right">
          <Link to="/metrics" className="btn-secondary">Metrics</Link>
          <span className="user-info">{user?.firstName} {user?.lastName}</span>
          <button className="btn-secondary" onClick={logout}>Sign Out</button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error">
          {error} <button onClick={clearError}>&times;</button>
        </div>
      )}

      <div className="toolbar">
        <div className="filters">
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setFilters({ statusFilter: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={priorityFilter ?? ''}
            onChange={(e) => setFilters({ priorityFilter: e.target.value || undefined })}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span className="task-count">{total} tasks</span>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <form className="create-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            maxLength={200}
            className="form-input"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={2000}
            rows={2}
            className="form-input"
          />
          <div className="form-row">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="form-input"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.dueDate ? form.dueDate.split('T')[0] : ''}
              onChange={(e) =>
                setForm({ ...form, dueDate: e.target.value ? e.target.value + 'T00:00:00Z' : null })
              }
              className="form-input"
            />
            <button type="submit" className="btn-primary" disabled={isLoading}>
              Create
            </button>
          </div>
        </form>
      )}

      {isLoading && tasks.length === 0 ? (
        <div className="loading">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">No tasks found. Create one to get started!</div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-card-header">
                <h3 className="task-title">{task.title}</h3>
                <span className="priority-badge" style={{ color: priorityColor(task.priority) }}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-card-footer">
                <div className="task-meta">
                  <span className="status-pill" style={{ background: statusColor(task.status) }}>
                    {task.status}
                  </span>
                  {task.dueDate && (
                    <span className="due-date">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="task-actions">
                  {STATUS_TRANSITIONS[task.status]?.map((next) => (
                    <button
                      key={next}
                      className="btn-sm"
                      onClick={() => changeStatus(task.id, next)}
                    >
                      → {next}
                    </button>
                  ))}
                  <button
                    className="btn-sm btn-danger"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
