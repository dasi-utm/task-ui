export type StatusCategoryKey = 'new' | 'indeterminate' | 'done';

export interface StatusCategory {
  key: StatusCategoryKey;
}

export interface IssueStatus {
  name: string;
  statusCategory: StatusCategory;
}

export interface IssueType {
  iconUrl: string;
  name: string;
}

export interface AvatarUrls {
  '48x48': string;
  '24x24'?: string;
  '16x16'?: string;
  '32x32'?: string;
}

export interface Assignee {
  displayName: string;
  avatarUrls: AvatarUrls;
}

export interface Project {
  name: string;
}

export interface IssueFields {
  summary: string;
  description?: string;
  issuetype?: IssueType;
  status?: IssueStatus;
  assignee?: Assignee;
  project?: Project;
}

export interface JiraIssue {
  key: string;
  webUrl?: string;
  fields: IssueFields;
}

export interface JiraIssueCollection {
  nodes: JiraIssue[];
  totalCount: number;
  webUrl?: string;
}
