import { AppShell } from '@/components/layout/app-shell';
import { AppIcon } from '@/components/ui/app-icon';

const setupSteps = [
  { label: 'Create your profile', detail: 'Name, employee ID, and designation', done: false },
  { label: 'Set salary rules', detail: 'Monthly, daily, and weekly-off rules', done: false },
  { label: 'Start tracking', detail: 'Attendance and cash activity stay on-device', done: false },
];

export default function HomePage() {
  return (
    <AppShell activePage="home">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PRIVATE FINANCE WORKSPACE</p>
          <h1>Good evening.</h1>
          <p className="page-subtitle">Your salary, attendance, and cash—always within reach.</p>
        </div>
        <button className="icon-button" aria-label="View notification status" type="button">
          <span className="status-dot" />
          <AppIcon name="shield" aria-hidden="true" size={18} />
        </button>
      </section>

      <section className="ticker-card" aria-labelledby="ticker-title">
        <div className="ticker-orb ticker-orb-left" />
        <div className="ticker-orb ticker-orb-right" />
        <div className="ticker-topline">
          <div>
            <p className="eyebrow ticker-label" id="ticker-title">NET LIVE EARNINGS</p>
            <span className="ticker-period">Set up your salary to begin</span>
          </div>
          <span className="local-pill"><span className="pulse-dot" />Local only</span>
        </div>

        <div className="ticker-amount" aria-label="Salary setup required">
          <span className="currency">PKR</span>
          <span>0.00</span>
        </div>

        <div className="ticker-footer">
          <span className="rate-badge"><AppIcon name="arrow-up-right" aria-hidden="true" size={15} />Rate ready after setup</span>
          <span className="shift-badge"><AppIcon name="calendar" aria-hidden="true" size={15} />No shift configured</span>
        </div>
      </section>

      <section className="action-strip" aria-label="Primary action">
        <div>
          <p className="eyebrow">FIRST TIME HERE?</p>
          <h2>Build your private salary wallet.</h2>
        </div>
        <a className="primary-button" href="/onboarding">
          <AppIcon name="plus" aria-hidden="true" size={18} />
          Set up now
        </a>
      </section>

      <section className="overview-grid" aria-label="Financial overview">
        <article className="metric-card">
          <div className="metric-icon company-icon"><AppIcon name="dollar" aria-hidden="true" size={20} /></div>
          <div>
            <p>Company balance</p>
            <strong>PKR —</strong>
            <span>Waiting for setup</span>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon pocket-icon"><AppIcon name="wallet" aria-hidden="true" size={20} /></div>
          <div>
            <p>Cash in hand</p>
            <strong>PKR —</strong>
            <span>Waiting for setup</span>
          </div>
        </article>
      </section>

      <section className="content-panel setup-panel" aria-labelledby="setup-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">GET STARTED</p>
            <h2 id="setup-title">Your workspace checklist</h2>
          </div>
          <span className="progress-label">0 / 3 complete</span>
        </div>
        <div className="checklist">
          {setupSteps.map((step, index) => (
            <div className="checklist-row" key={step.label}>
              <span className="step-number" aria-hidden="true">{index + 1}</span>
              <div>
                <h3>{step.label}</h3>
                <p>{step.detail}</p>
              </div>
              <span className="row-arrow" aria-hidden="true">→</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
