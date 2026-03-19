import type { IssueStatus } from '../../types/jira';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: IssueStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status?.name || !status?.statusCategory?.key) return null;

  const modifier = `status-badge--${status.statusCategory.key}`;

  return (
    <span className={`status-badge ${modifier}`}>
      {status.name}
    </span>
  );
};
