import { forwardRef } from 'react';
import './IssueTypeIcon.css';

interface IssueTypeIconProps {
  iconUrl: string;
  name: string;
}

export const IssueTypeIcon = forwardRef<HTMLDivElement, IssueTypeIconProps>(
  ({ iconUrl, name, ...rest }, ref) => (
    <div ref={ref} className="issue-type-icon" {...rest}>
      <img src={iconUrl} alt={name} className="issue-type-icon__img" />
    </div>
  )
);

IssueTypeIcon.displayName = 'IssueTypeIcon';
