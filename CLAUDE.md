# TaskManager.UI

## Project Overview

React dashboard frontend for a distributed task management system. Core features include a task board with drag-and-drop, real-time updates via SignalR, an analytics dashboard, and authentication UI. UI components may originate from Figma or Lovable exports — Claude should integrate, refactor, and wire them into the project structure described below.

## Tech Stack

- **React 18+** with **TypeScript** (strict mode enabled in tsconfig)
- **Zustand** for state management
- **SignalR** client (`@microsoft/signalr`) for real-time communication with the .NET backend
- **React Router** for client-side routing
- **Vite** for build tooling and dev server
- **npm** as package manager

## Architecture / Directory Structure

```
src/
  components/        # Reusable UI components (Button, Modal, Card, etc.)
    imported/        # Landing zone for Figma/Lovable exports (temporary)
  pages/             # Route-level page components, one folder per page
  stores/            # Zustand stores, one file per domain
  services/          # API client, SignalR connection manager
  hooks/             # Custom React hooks
  types/             # Shared TypeScript interfaces and types
  utils/             # Pure helper functions
```

### Key directories explained

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `components/` | Reusable, composable UI components | `Button/Button.tsx`, `Modal/Modal.tsx`, `TaskCard/TaskCard.tsx` |
| `components/imported/` | Raw Figma/Lovable exports awaiting refactor | Temporary holding area — see Lovable/Figma workflow below |
| `pages/` | One folder per route-level page | `Dashboard/`, `TaskBoard/`, `Login/`, `Analytics/` |
| `stores/` | Zustand stores, one file per domain | `authStore.ts`, `taskStore.ts`, `analyticsStore.ts` |
| `services/` | API client and SignalR connection manager | `api.ts`, `signalr.ts` |
| `hooks/` | Custom React hooks | `useAuth.ts`, `useTasks.ts`, `useRealtime.ts` |
| `types/` | Shared TypeScript interfaces and types | `TaskDto.ts`, `UserDto.ts`, `ApiResponse.ts` |
| `utils/` | Pure helper functions with no side effects | `formatDate.ts`, `parseError.ts` |

## Naming Conventions

- **PascalCase** for components and type files: `TaskCard.tsx`, `TaskDto.ts`
- **camelCase** for hooks, utils, and stores: `useAuth.ts`, `taskStore.ts`, `formatDate.ts`
- Component files must match the component name: `TaskBoard/TaskBoard.tsx` exports `TaskBoard`
- Each component folder uses a barrel export via `index.ts`
- Test files sit next to the code they test: `TaskCard/TaskCard.test.tsx`

## Component Rules

- **Functional components only** — never use class components.
- Props are defined as a `{ComponentName}Props` interface in the same file or colocated types file:
  ```tsx
  interface TaskCardProps {
    task: TaskDto;
    onSelect: (id: string) => void;
  }
  ```
- Colocate component-specific styles, tests, and types inside the component folder.
- Keep components focused — split into subcomponents when a file exceeds approximately 150 lines.
- Export components as named exports, not default exports.

## State Management (Zustand)

- **One store per domain**: `authStore.ts`, `taskStore.ts`, `analyticsStore.ts`.
- Actions are defined **inside** the store — never define actions externally.
- Use selectors for derived state to avoid unnecessary re-renders.
- Never mutate store state directly outside of actions.

Example store pattern:

```ts
import { create } from 'zustand';

interface TaskState {
  tasks: TaskDto[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: TaskDto) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  fetchTasks: async () => {
    set({ isLoading: true });
    const tasks = await taskService.getAll();
    set({ tasks, isLoading: false });
  },
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
}));
```

## API Integration

- Centralized API client lives in `services/api.ts`.
- All request and response shapes are typed using interfaces from `types/`.
- Base URL is read from the environment variable `VITE_API_URL`.
- JWT token is attached to every request via an interceptor (axios) or wrapper (fetch).
- Error handling is consistent: catch errors, parse the response body, and surface a meaningful message to the UI via the store or a toast/notification.

```ts
// services/api.ts — conceptual structure
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## SignalR Integration

- Connection manager lives in `services/signalr.ts`.
- Auto-reconnect with exponential backoff is configured on the `HubConnectionBuilder`.
- Hub URL is read from the environment variable `VITE_SIGNALR_URL`.
- Incoming SignalR events are mapped directly to Zustand store update actions (e.g., `TaskCreated` event calls `taskStore.addTask`).
- Connection state (connecting, connected, disconnected, reconnecting) is exposed to components via the `useRealtime` hook.

```ts
// services/signalr.ts — conceptual structure
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl(import.meta.env.VITE_SIGNALR_URL, {
    accessTokenFactory: () => useAuthStore.getState().token ?? '',
  })
  .withAutomaticReconnect({
    nextRetryDelayInMilliseconds: (ctx) =>
      Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000),
  })
  .build();
```

## Lovable / Figma Import Workflow

When importing components from Figma or Lovable:

1. Place raw exported files into `components/imported/` as a temporary landing zone.
2. Refactor each component into the proper component folder structure (`components/{ComponentName}/`).
3. Replace inline styles with the project's styling approach (CSS modules, Tailwind, or styled-components — whichever is adopted).
4. Add proper TypeScript types — eliminate all `any` types.
5. Wire the component to Zustand stores and API services as needed.
6. Delete the original file from `components/imported/` once refactoring is complete.

## Testing

- **Framework**: Vitest + React Testing Library.
- **Philosophy**: Test user behavior, not implementation details. Query by role, label, or text — avoid test IDs when possible.
- **Mocking**: Mock API calls and SignalR at the service layer (not at the network level).
- **File naming**: `{Component}.test.tsx` colocated in the component folder.
- Run tests with `npm test`.

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| Vite dev server | 3000 | Frontend dev server |
| Backend API + SignalR Hub | 3001 | REST API and SignalR at `/hubs/tasks` |

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build |
| `npm test` | Run tests via Vitest |
| `npm run lint` | Lint the codebase |

## Environment Variables

Create a `.env` file (or `.env.local`) in the project root with:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SIGNALR_URL=http://localhost:3001/hubs/tasks
```

All environment variables must be prefixed with `VITE_` to be exposed to client-side code by Vite. Access them via `import.meta.env.VITE_*`.
