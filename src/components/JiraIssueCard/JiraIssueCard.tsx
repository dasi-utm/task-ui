import { useIntl } from 'react-intl';
import type { JiraIssue } from '../../types/jira';
import { StatusBadge } from '../StatusBadge';
import { IssueTypeIcon } from '../IssueTypeIcon';
import { Tooltip } from '../Tooltip';
import { ExternalLinkIcon } from './ExternalLinkIcon';
import './JiraIssueCard.css';

interface JiraIssueCardProps {
  issue: JiraIssue;
  showDescription?: boolean;
}

export const JiraIssueCard = ({ issue, showDescription = false }: JiraIssueCardProps) => {
  const { formatMessage } = useIntl();
  const { key, fields, webUrl } = issue;
  const { summary, description, issuetype, status, assignee, project } = fields;

  return (
    <>
      <div className="jira-issue-card">
        {issuetype?.iconUrl && (
          <Tooltip content={issuetype.name ?? ''} position="right">
            <IssueTypeIcon iconUrl={issuetype.iconUrl} name={issuetype.name ?? ''} />
          </Tooltip>
        )}

        <div className="jira-issue-card__content">
          <div className="jira-issue-card__header">
            <h3 className="jira-issue-card__title">{summary}</h3>
          </div>

          <div className="jira-issue-card__meta">
            {project?.name && (
              <>
                <span className="jira-issue-card__project">{project.name}</span>
                <span className="jira-issue-card__dot">•</span>
              </>
            )}

            {key && (
              <>
                <span className="jira-issue-card__key">{key}</span>
                <span className="jira-issue-card__dot">•</span>
              </>
            )}

            {assignee ? (
              <span className="jira-issue-card__assignee-info">
                {assignee.avatarUrls?.['48x48'] && (
                  <img
                    src={assignee.avatarUrls['48x48']}
                    alt={assignee.displayName}
                    className="jira-issue-card__avatar"
                  />
                )}
                <span className="jira-issue-card__assignee-name">
                  {assignee.displayName}
                </span>
              </span>
            ) : (
              <span>
                {formatMessage({ id: 'jira.widget.unassigned', defaultMessage: 'Unassigned' })}
              </span>
            )}

            {status && (
              <>
                <span className="jira-issue-card__dot">•</span>
                <StatusBadge status={status} />
              </>
            )}
          </div>
        </div>

        {webUrl && (
          <Tooltip
            content={formatMessage({ id: 'jira.widget.openLink', defaultMessage: 'Open link' })}
          >
            <a
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="jira-issue-card__link-btn"
              aria-label={formatMessage({
                id: 'jira.widget.openInJira',
                defaultMessage: 'Open work item in Jira',
              })}
            >
              <ExternalLinkIcon />
            </a>
          </Tooltip>
        )}
      </div>

      {showDescription && description && (
        <div className="jira-issue-card__description">
          <p>{description}</p>
        </div>
      )}
    </>
  );
};
