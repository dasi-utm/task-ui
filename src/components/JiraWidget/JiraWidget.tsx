import { Fragment } from 'react';
import { useIntl } from 'react-intl';
import type { JiraIssueCollection } from '../../types/jira';
import { JiraIssueCard } from '../JiraIssueCard';
import './JiraWidget.css';

const MAX_VISIBLE = 5;

interface JiraWidgetProps {
  issues: JiraIssueCollection;
}

export const JiraWidget = ({ issues }: JiraWidgetProps) => {
  const { formatMessage } = useIntl();
  const nodes = issues?.nodes ?? [];
  const totalCount = issues?.totalCount ?? 0;

  if (nodes.length === 0) return null;

  const visible = nodes.slice(0, MAX_VISIBLE);
  const isSingle = visible.length === 1;
  const overflow = totalCount - visible.length;

  return (
    <div className="jira-widget">
      {visible.map((issue, idx) => (
        <Fragment key={issue.key || idx}>
          <JiraIssueCard issue={issue} showDescription={isSingle} />
          {idx < visible.length - 1 && <div className="jira-widget__separator" />}
        </Fragment>
      ))}

      {overflow > 0 && (
        <div
          className={`jira-widget__more ${
            issues.webUrl ? 'jira-widget__more--with-link' : ''
          }`}
        >
          <span className="jira-widget__more-text">
            {formatMessage(
              { id: 'jira.widget.moreItems', defaultMessage: '+{count} more' },
              { count: overflow }
            )}
          </span>
          {issues.webUrl && (
            <a
              href={issues.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="jira-widget__more-link"
            >
              {formatMessage({
                id: 'jira.widget.openInJiraButton',
                defaultMessage: 'Open in Jira',
              })}
            </a>
          )}
        </div>
      )}
    </div>
  );
};
