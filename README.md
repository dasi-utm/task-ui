# task-ui

React + TypeScript frontend for the distributed task management system. Provides a task board with real-time updates via SignalR, user authentication, filtering and sorting, and an analytics dashboard. Built with Vite, Zustand, and Axios.

## Table of contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Docker](#docker)
- [Pages and routing](#pages-and-routing)
- [State management](#state-management)
- [API integration](#api-integration)
- [Real-time updates](#real-time-updates)
- [Project structure](#project-structure)
- [Type definitions](#type-definitions)
- [Inter-service dependencies](#inter-service-dependencies)

---

## Architecture

```
Browser
  │
  ├── React Router ──► pages (Dashboard, Login, Register)
  │
  ├── Zustand stores
  │     ├── authStore   ← login / register / logout / token persistence
  │     └── taskStore   ← task list, filters, pagination, CRUD, real-time updates
  │
  ├── Axios (services/api.ts)
  │     └── REST calls ──► .NET backend  :3001/api/v1
  │
  └── SignalR (services/signalr.ts)
        └── WebSocket  ──► .NET backend  :3001/hubs/tasks
```

All server state flows through the Zustand stores. SignalR events are wired to store actions so every connected tab stays in sync without polling.

---

## Prerequisites

- Node.js >= 20
- npm >= 10
- A running instance of the .NET backend (see [inter-service dependencies](#inter-service-dependencies))

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create a local env file
cp .env.example .env.local   # or create .env.local manually (see below)

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment variables

Create a `.env.local` file in the project root (Vite ignores `.env.local` in version control by convention):

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SIGNALR_URL=http://localhost:3001/hubs/tasks
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Base URL for all REST API calls |
| `VITE_SIGNALR_URL` | Yes | SignalR hub URL for real-time task events |

All variables must be prefixed with `VITE_` to be exposed to client-side code. Access them via `import.meta.env.VITE_*`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR on port 3000 |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally for inspection |
| `npm run lint` | Run ESLint across the codebase |

---

## Docker

**Development** (source mounted, Vite HMR):

```bash
docker compose up
```

**Production image** (static files served by nginx):

```bash
docker build --target production \
  --build-arg VITE_API_URL=https://api.example.com/api/v1 \
  --build-arg VITE_SIGNALR_URL=https://api.example.com/hubs/tasks \
  -t task-ui .

docker run -p 80:80 task-ui
```

`VITE_*` variables are baked into the static bundle at build time — pass them as `--build-arg` when building the production image.

The `docker-compose.yml` in this directory runs the Vite dev server only. To run the full stack with all services see the root `docker-compose.yml`.

---

## Pages and routing

| Path | Page | Auth required |
|------|------|:---:|
| `/` | Redirects to `/dashboard` | — |
| `/login` | Login form | No |
| `/register` | Registration form | No |
| `/dashboard` | Task board + create form | Yes |
| `/jira-widget` | Jira widget demo | No |

`ProtectedRoute` wraps any route that requires authentication. If no JWT token is present in the store, it redirects to `/login`.

### Dashboard

- Paginated task list with status and priority filters
- Create task form (title, description, priority, due date)
- Per-task status transitions based on allowed workflow:

| Current status | Allowed transitions |
|----------------|---------------------|
| Pending | InProgress, Cancelled |
| InProgress | Completed, Pending, Cancelled |
| Completed | — |
| Cancelled | — |

- SignalR connection status indicator (connecting / connected / reconnecting / disconnected)
- All list mutations are immediately reflected via real-time events

---

## State management

The app uses two Zustand stores. Actions are defined inside the store — never externally.

### authStore (`src/stores/authStore.ts`)

Manages JWT token and user identity. The token is persisted to `localStorage` and rehydrated on page load via `hydrate()`.

```ts
interface AuthState {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, firstName: string, lastName: string): Promise<void>;
  logout(): void;
  clearError(): void;
  hydrate(): void;
}
```

### taskStore (`src/stores/taskStore.ts`)

Manages the task list, filters, pagination, CRUD operations, and real-time update handlers.

```ts
interface TaskState {
  tasks: TaskDto[];
  selectedTask: TaskDto | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  statusFilter?: string;
  priorityFilter?: string;
  sortBy?: string;
  sortDescending: boolean;

  // Async CRUD
  fetchTasks(params?: GetTasksParams): Promise<void>;
  fetchTask(id: string): Promise<void>;
  createTask(dto: CreateTaskDto): Promise<void>;
  updateTask(id: string, dto: UpdateTaskDto): Promise<void>;
  deleteTask(id: string): Promise<void>;
  changeStatus(id: string, status: string): Promise<void>;
  assignTask(id: string, userId: string): Promise<void>;

  // Filters & pagination
  setFilters(filters: Partial<TaskFilters>): void;
  setPage(page: number): void;
  clearError(): void;

  // Real-time handlers (called by useRealtime hook)
  addTask(task: TaskDto): void;
  updateTaskInList(task: TaskDto): void;
  removeTask(taskId: string): void;
  updateTaskStatus(taskId: string, newStatus: string): void;
}
```

---

## API integration

The Axios instance in `src/services/api.ts` handles all HTTP communication:

- **Base URL** set from `VITE_API_URL`
- **Request interceptor** — attaches `Authorization: Bearer <token>` from `authStore`
- **Response interceptor** — on HTTP 401, clears auth state and redirects to `/login`

### Endpoints used

#### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Returns `{ token, expiresAt, user }` |
| POST | `/auth/register` | Returns `UserDto` |

#### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | Paginated list; query params: `page`, `pageSize`, `status`, `priority`, `assignedToId`, `sortBy`, `sortDescending` |
| GET | `/tasks/:id` | Single task |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| PATCH | `/tasks/:id/status` | Change status |
| PATCH | `/tasks/:id/assign` | Assign to user |

#### Statistics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks/statistics` | Overall counts |
| GET | `/tasks/statistics/by-user` | Per-user breakdown |
| GET | `/tasks/statistics/timeline` | Time-series data (`?period`) |

#### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | Paginated user list |
| PATCH | `/admin/users/:userId/role` | Change user role |

---

## Real-time updates

`src/services/signalr.ts` manages the HubConnection lifecycle:

- Connects to `VITE_SIGNALR_URL` using the JWT token from `authStore` as the access token
- Automatic reconnection with exponential backoff, capped at 30 seconds

`src/hooks/useRealtime.ts` subscribes to SignalR events and dispatches them to `taskStore`:

| SignalR event | Store action |
|---------------|--------------|
| `TaskCreated` | `addTask()` |
| `TaskUpdated` | `updateTaskInList()` |
| `TaskDeleted` | `removeTask()` |
| `TaskStatusChanged` | `updateTaskStatus()` |

Mount `useRealtime()` once in the Dashboard — it tears down the connection on unmount.

---

## Project structure

```
src/
├── components/
│   ├── IssueTypeIcon/       # Jira issue type icon renderer
│   ├── JiraIssueCard/       # Jira issue card
│   ├── JiraWidget/          # Jira integration widget
│   ├── ProtectedRoute/      # Redirects to /login if unauthenticated
│   ├── StatusBadge/         # Coloured status pill
│   └── Tooltip/             # Generic tooltip wrapper
├── pages/
│   ├── Dashboard/           # Main task board
│   ├── Login/               # Login form
│   ├── Register/            # Registration form
│   └── JiraWidgetDemo/      # Jira widget demo page
├── stores/
│   ├── authStore.ts         # Authentication state + actions
│   └── taskStore.ts         # Task list state + actions
├── services/
│   ├── api.ts               # Axios instance + service methods per domain
│   └── signalr.ts           # HubConnection builder + event registration
├── hooks/
│   └── useRealtime.ts       # Connects SignalR events to taskStore actions
├── types/
│   ├── task.ts              # TaskDto, TaskStatus, TaskPriority, CreateTaskDto, etc.
│   ├── user.ts              # UserDto, AuthResponseDto
│   ├── api.ts               # PagedResult<T>, ErrorResponse
│   └── jira.ts              # Jira-specific types
├── locales/
│   └── messages.ts          # react-intl message catalogue
├── App.tsx                  # Root router + route definitions
├── main.tsx                 # React entry point
├── theme.css                # Global CSS custom properties
└── vite-env.d.ts            # import.meta.env type augmentation
```

New Figma or Lovable component exports should be dropped into `src/components/imported/` first, then refactored into their own folder following the pattern above, and the temporary file deleted.

---

## Type definitions

### `TaskDto`

```ts
interface TaskDto {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
```

### `UserDto`

```ts
interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
```

---

## Inter-service dependencies

| Dependency | What it provides |
|------------|-----------------|
| .NET backend `:3001` | REST API (`/api/v1/*`) and SignalR hub (`/hubs/tasks`) |
| task-analytics `:3003` | Analytics data for the analytics dashboard section |

This service is a **pure frontend** — it never connects to RabbitMQ or PostgreSQL directly.
