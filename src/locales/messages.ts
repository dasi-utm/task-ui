const en: Record<string, string> = {
  'jira.widget.unassigned': 'Unassigned',
  'jira.widget.openInJira': 'Open work item in Jira',
  'jira.widget.openInJiraButton': 'Open in Jira',
  'jira.widget.openLink': 'Open link',
  'jira.widget.moreItems': '+{count} more',
};

const es: Record<string, string> = {
  'jira.widget.unassigned': 'Sin asignar',
  'jira.widget.openInJira': 'Abrir ticket en Jira',
  'jira.widget.openInJiraButton': 'Abrir en Jira',
  'jira.widget.openLink': 'Abrir enlace',
  'jira.widget.moreItems': '+{count} más',
};

const ja: Record<string, string> = {
  'jira.widget.unassigned': '未割り当て',
  'jira.widget.openInJira': 'Jiraでチケットを開く',
  'jira.widget.openInJiraButton': 'Jiraで開く',
  'jira.widget.openLink': 'リンクを開く',
  'jira.widget.moreItems': '+{count}件',
};

const it: Record<string, string> = {
  'jira.widget.unassigned': 'Non attribuito',
  'jira.widget.openInJira': 'Apri ticket in Jira',
  'jira.widget.openInJiraButton': 'Apri in Jira',
  'jira.widget.openLink': 'Apri link',
  'jira.widget.moreItems': '+{count} altri',
};

const de: Record<string, string> = {
  'jira.widget.unassigned': 'Nicht zugewiesen',
  'jira.widget.openInJira': 'Ticket in Jira öffnen',
  'jira.widget.openInJiraButton': 'In Jira öffnen',
  'jira.widget.openLink': 'Link öffnen',
  'jira.widget.moreItems': '+{count} weitere',
};

const fr: Record<string, string> = {
  'jira.widget.unassigned': 'Non attribué',
  'jira.widget.openInJira': 'Ouvrir le ticket dans Jira',
  'jira.widget.openInJiraButton': 'Ouvrir dans Jira',
  'jira.widget.openLink': 'Ouvrir le lien',
  'jira.widget.moreItems': '+{count} de plus',
};

export const localeMessages: Record<string, Record<string, string>> = {
  'en-US': en,
  'es-ES': es,
  'ja-JP': ja,
  'it-IT': it,
  'de-DE': de,
  'fr-FR': fr,
};

export const supportedLocales = Object.keys(localeMessages);
