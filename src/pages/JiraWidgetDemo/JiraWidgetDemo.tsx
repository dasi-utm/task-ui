import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { JiraWidget } from '../../components/JiraWidget';
import { localeMessages, supportedLocales } from '../../locales/messages';
import { singleIssue, multipleIssues, overflowIssues } from './mockData';
import './JiraWidgetDemo.css';

type DemoView = 'single' | 'multiple' | 'overflow';

export const JiraWidgetDemo = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [locale, setLocale] = useState('en-US');
  const [view, setView] = useState<DemoView>('multiple');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const issueData = {
    single: singleIssue,
    multiple: multipleIssues,
    overflow: overflowIssues,
  };

  return (
    <IntlProvider
      locale={locale}
      messages={localeMessages[locale] ?? localeMessages['en-US']}
    >
      <div className="demo">
        <header className="demo__header">
          <h1 className="demo__title">Jira Widget</h1>
          <p className="demo__subtitle">
            Issue display component for the distributed task management system
          </p>
        </header>

        <div className="demo__controls">
          <div className="demo__control-group">
            <label className="demo__label">Theme</label>
            <button className="demo__btn" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>

          <div className="demo__control-group">
            <label className="demo__label">Locale</label>
            <select
              className="demo__select"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {supportedLocales.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="demo__control-group">
            <label className="demo__label">View</label>
            <div className="demo__btn-group">
              {(['single', 'multiple', 'overflow'] as DemoView[]).map((v) => (
                <button
                  key={v}
                  className={`demo__btn ${view === v ? 'demo__btn--active' : ''}`}
                  onClick={() => setView(v)}
                >
                  {v === 'single'
                    ? 'Single Issue'
                    : v === 'multiple'
                    ? 'Multiple'
                    : 'With Overflow'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="demo__widget-area">
          <JiraWidget issues={issueData[view]} />
        </div>
      </div>
    </IntlProvider>
  );
};
