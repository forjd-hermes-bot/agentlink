import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Code2,
  GitBranch,
  GitPullRequest,
  Lock,
  PlugZap,
  RadioTower,
  ShieldCheck,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import './styles.css';

const steps = [
  { label: 'Install GitHub App', detail: 'Pick org + repos', icon: GitPullRequest },
  { label: 'Choose event routes', detail: 'PR comments, issues, reviews, CI', icon: Workflow },
  { label: 'Deliver to agents', detail: 'Hermes, OpenClaw, Codex, Claude Code', icon: Bot },
];

const events = [
  { type: 'issue_comment', repo: 'forjd/browse', text: '@agentlink research this API change', status: 'queued' },
  { type: 'pull_request', repo: 'forjd/ctx', text: 'CI failed on bun test', status: 'running' },
  { type: 'issues', repo: 'forjd/minimap', text: 'label: agent-ready', status: 'done' },
];

function App() {
  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand"><span className="brandMark"><PlugZap size={18} /></span>AgentLink</div>
        <div className="navLinks">
          <a href="#flow">Flow</a>
          <a href="#mockup">Dashboard</a>
          <a href="#daemon">Daemon</a>
        </div>
        <button className="ghostBtn">Request demo <ChevronRight size={15} /></button>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> GitHub events for every agent.</div>
        <h1>A GitHub event bridge for AI agents and bots.</h1>
        <p className="heroCopy">
          AgentLink lets Hermes Agent, OpenClaw, Codex, Claude Code, OpenCode, and custom bots receive PR comments, issues, reviews, labels, and CI events without each project building its own GitHub App or webhook server.
        </p>
        <div className="heroActions">
          <button className="primaryBtn">Install GitHub App <ArrowRight size={16} /></button>
          <button className="secondaryBtn"><Terminal size={16} /> bunx agentlink connect --adapter hermes</button>
        </div>

        <div className="heroGrid" id="flow">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="stepCard" key={step.label}>
                <div className="stepTop"><Icon size={18} /><span>0{index + 1}</span></div>
                <h3>{step.label}</h3>
                <p>{step.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="product" id="mockup">
        <div className="sectionHeader">
          <div>
            <span className="kicker">Operator console</span>
            <h2>One place to route GitHub events into agent adapters.</h2>
          </div>
          <p>GitHub sends events to AgentLink. The relay verifies, normalizes, filters, and delivers them to the configured bot over an outbound WebSocket, local command, or adapter protocol.</p>
        </div>

        <div className="dashboard">
          <aside className="sidebar">
            <div className="sideTitle"><GitPullRequest size={17} /> forjd</div>
            {['Repos', 'Triggers', 'Agents', 'Runs', 'Secrets'].map((item, i) => (
              <div className={`sideItem ${i === 1 ? 'active' : ''}`} key={item}>{item}</div>
            ))}
            <div className="connectionCard">
              <div className="statusDot" /> Event bridge online
              <code>wss://relay.agentlink.dev</code>
            </div>
          </aside>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h3>Trigger routes</h3>
                <p>Filter GitHub events before they become standardized agent messages.</p>
              </div>
              <button className="smallBtn"><Zap size={14} /> New route</button>
            </div>

            <div className="routes">
              <RouteCard title="Mention router" repo="All selected repos" event="issue_comment" agent="Hermes Agent" rule="comment.body contains @agentlink" />
              <RouteCard title="Bot inbox" repo="forjd/openclaw-demo" event="pull_request_review_comment" agent="OpenClaw" rule="thread mentions @openclaw" />
              <RouteCard title="Issue triage" repo="forjd/*" event="issues.opened" agent="Local command" rule="label includes agent-ready" />
            </div>
          </div>

          <div className="rightRail">
            <h3>Live jobs</h3>
            {events.map((event) => <JobCard key={`${event.repo}-${event.type}`} {...event} />)}
          </div>
        </div>
      </section>

      <section className="daemon" id="daemon">
        <div className="terminalCard">
          <div className="terminalTop"><span /> <span /> <span /></div>
          <pre>{`$ bunx agentlink connect --adapter hermes
✓ authenticated as forjd-hermes-bot
✓ paired workspace: forjd
✓ opened outbound websocket

listening for GitHub events...
→ evt_8K2P issue_comment forjd/browse
→ normalized payload: agentlink.event.v1
→ delivered to hermes stdin adapter
✓ response posted back to GitHub`}</pre>
        </div>
        <div className="daemonCopy">
          <span className="kicker">Agent event delivery</span>
          <h2>Agents receive GitHub events without public inbound webhooks.</h2>
          <ul>
            <li><Check size={16} /> WebSocket initiated from the agent host</li>
            <li><Check size={16} /> Normalized payloads for every GitHub event type</li>
            <li><Check size={16} /> Adapters for Hermes, OpenClaw, shell commands, and local HTTP</li>
            <li><Check size={16} /> GitHub App tokens stay server-side for comments/statuses</li>
          </ul>
        </div>
      </section>

      <section className="architecture">
        <div className="archNode"><GitPullRequest /> GitHub App</div>
        <ArrowRight className="archArrow" />
        <div className="archNode"><Workflow /> Normalize + Route</div>
        <ArrowRight className="archArrow" />
        <div className="archNode"><RadioTower /> Adapter Delivery</div>
        <ArrowRight className="archArrow" />
        <div className="archNode"><Bot /> Hermes / OpenClaw / Bot</div>
      </section>

      <footer>
        <div><Lock size={15} /> Open source event bridge mockup</div>
        <div className="footerLinks"><span>GitHub App</span><span>Relay</span><span>Payloads</span><span>Adapters</span></div>
      </footer>
    </main>
  );
}

function RouteCard({ title, repo, event, agent, rule }: { title: string; repo: string; event: string; agent: string; rule: string }) {
  return (
    <div className="routeCard">
      <div className="routeIcon"><GitBranch size={16} /></div>
      <div className="routeMain">
        <div className="routeTitle">{title}<span>{repo}</span></div>
        <div className="routeMeta"><code>{event}</code><span>→</span><strong>{agent}</strong></div>
        <p>{rule}</p>
      </div>
      <ShieldCheck className="routeCheck" size={18} />
    </div>
  );
}

function JobCard({ type, repo, text, status }: { type: string; repo: string; text: string; status: string }) {
  return (
    <div className="jobCard">
      <div className="jobTop"><code>{type}</code><span className={status}>{status}</span></div>
      <strong>{repo}</strong>
      <p>{text}</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
