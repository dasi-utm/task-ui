import type { JiraIssueCollection } from '../../types/jira';

const JIRA_ICON_BASE = 'https://cdn.simpleicons.org';

export const singleIssue: JiraIssueCollection = {
  nodes: [
    {
      key: 'TASK-142',
      webUrl: '#',
      fields: {
        summary: 'Implement real-time task status updates via SignalR',
        description:
          'Set up SignalR hub connection in the React frontend to receive live task status changes. Should handle reconnection gracefully with exponential backoff. Update the Zustand task store when events arrive.',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/jirasoftware/0052CC`,
          name: 'Story',
        },
        status: {
          name: 'In Progress',
          statusCategory: { key: 'indeterminate' },
        },
        assignee: {
          displayName: 'Adrian Gherman',
          avatarUrls: {
            '48x48': `https://ui-avatars.com/api/?name=Adrian+Gherman&background=4f87e0&color=fff&size=48`,
          },
        },
        project: { name: 'Task Manager' },
      },
    },
  ],
  totalCount: 1,
};

export const multipleIssues: JiraIssueCollection = {
  nodes: [
    {
      key: 'TASK-142',
      webUrl: '#',
      fields: {
        summary: 'Implement real-time task status updates via SignalR',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/jirasoftware/0052CC`,
          name: 'Story',
        },
        status: {
          name: 'In Progress',
          statusCategory: { key: 'indeterminate' },
        },
        assignee: {
          displayName: 'Adrian Gherman',
          avatarUrls: {
            '48x48': `https://ui-avatars.com/api/?name=AG&background=4f87e0&color=fff&size=48`,
          },
        },
        project: { name: 'Task Manager' },
      },
    },
    {
      key: 'TASK-138',
      webUrl: '#',
      fields: {
        summary: 'Design PostgreSQL schema for task assignments',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/postgresql/4169E1`,
          name: 'Task',
        },
        status: {
          name: 'Done',
          statusCategory: { key: 'done' },
        },
        assignee: {
          displayName: 'Person 1',
          avatarUrls: {
            '48x48': `https://ui-avatars.com/api/?name=P1&background=22c55e&color=fff&size=48`,
          },
        },
        project: { name: 'Task Manager' },
      },
    },
    {
      key: 'TASK-155',
      webUrl: '#',
      fields: {
        summary: 'Configure RabbitMQ exchange for task events',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/rabbitmq/FF6600`,
          name: 'Task',
        },
        status: {
          name: 'To Do',
          statusCategory: { key: 'new' },
        },
        project: { name: 'Task Manager' },
      },
    },
    {
      key: 'TASK-160',
      webUrl: '#',
      fields: {
        summary: 'Fix JWT token refresh causing 401 on long sessions',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/bugsnag/4949E4`,
          name: 'Bug',
        },
        status: {
          name: 'In Review',
          statusCategory: { key: 'indeterminate' },
        },
        assignee: {
          displayName: 'Person 2',
          avatarUrls: {
            '48x48': `https://ui-avatars.com/api/?name=P2&background=ef4444&color=fff&size=48`,
          },
        },
        project: { name: 'Task Manager' },
      },
    },
  ],
  totalCount: 4,
};

export const overflowIssues: JiraIssueCollection = {
  nodes: [
    ...multipleIssues.nodes,
    {
      key: 'TASK-170',
      webUrl: '#',
      fields: {
        summary: 'Add analytics dashboard with chart.js integration',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/chartdotjs/FF6384`,
          name: 'Epic',
        },
        status: {
          name: 'To Do',
          statusCategory: { key: 'new' },
        },
        assignee: {
          displayName: 'Person 3',
          avatarUrls: {
            '48x48': `https://ui-avatars.com/api/?name=P3&background=a855f7&color=fff&size=48`,
          },
        },
        project: { name: 'Task Manager' },
      },
    },
    {
      key: 'TASK-175',
      webUrl: '#',
      fields: {
        summary: 'Set up CI/CD pipeline with GitHub Actions',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/githubactions/2088FF`,
          name: 'Task',
        },
        status: {
          name: 'In Progress',
          statusCategory: { key: 'indeterminate' },
        },
        assignee: {
          displayName: 'Person 4',
          avatarUrls: {
            '48x48': `https://ui-avatars.com/api/?name=P4&background=f59e0b&color=fff&size=48`,
          },
        },
        project: { name: 'Task Manager' },
      },
    },
    {
      key: 'TASK-180',
      webUrl: '#',
      fields: {
        summary: 'Implement drag-and-drop for task board columns',
        issuetype: {
          iconUrl: `${JIRA_ICON_BASE}/jirasoftware/0052CC`,
          name: 'Story',
        },
        status: {
          name: 'To Do',
          statusCategory: { key: 'new' },
        },
        project: { name: 'Task Manager' },
      },
    },
  ],
  totalCount: 12,
  webUrl: '#',
};
