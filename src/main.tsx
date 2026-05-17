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
  { label: 'Run local daemon', detail: 'Outbound WebSocket only', icon: RadioTower },
  { label: 'Agent handles work', detail: 'Hermes, Codex, Claude, OpenCode', icon: Bot },
];

const events = [
  { type: 'issue_comment', repo: 'forjd/browse', text: '@agentlink research this API change', status: 'queued' },
  { type: 'pull_request', repo: 'forjd/ctx', text: 'CI failed on bun test', status: 'running' },
  { type: 'issues', repo: 'forjd/minimap', text: 'label: agent-ready', status: 'done' },
];

const agents = ['Hermes', 'Codex', 'Claude Code', 'OpenCode'];

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
        <div className="eyebrow"><span className="pulse" /> Cloud trigger. Local execution.</div>
        <h1>Connect GitHub repos to AI agents without exposing your machine.</h1>
        <p className="heroCopy">
          AgentLink is a GitHub App and local daemon that routes issues, PRs, comments, and CI failures to your preferred coding agent over an outbound WebSocket.
        </p>
        <div className="heroActions">
          <button className="primaryBtn">Install GitHub App <ArrowRight size={16} /></button>
          <button className="secondaryBtn"><Terminal size={16} /> bunx agentlink connect</button>
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
            <h2>One place to wire repo events to local workers.</h2>
          </div>
          <p>GitHub sends events to AgentLink. Your local daemon maintains a secure outbound socket, receives jobs, runs the agent, and streams results back.</p>
        </div>

        <div className="dashboard">
          <aside className="sidebar">
            <div className="sideTitle"><GitPullRequest size={17} /> forjd</div>
            {['Repos', 'Triggers', 'Agents', 'Runs', 'Secrets'].map((item, i) => (
              <div className={`sideItem ${i === 1 ? 'active' : ''}`} key={item}>{item}</div>
            ))}
            <div className="connectionCard">
              <div className="statusDot" /> Local daemon online
              <code>wss://relay.agentlink.dev</code>
            </div>
          </aside>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h3>Trigger routes</h3>
                <p>Filter GitHub events before they become agent jobs.</p>
              </div>
              <button className="smallBtn"><Zap size={14} /> New route</button>
            </div>

            <div className="routes">
              <RouteCard title="Mention router" repo="All selected repos" event="issue_comment" agent="Hermes" rule="comment.body contains @agentlink" />
              <RouteCard title="CI repair" repo="forjd/browse" event="check_suite.completed" agent="Codex" rule="conclusion is failure" />
              <RouteCard title="Issue triage" repo="forjd/*" event="issues.opened" agent="Hermes" rule="label includes agent-ready" />
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
          <pre>{`$ bunx agentlink connect
✓ authenticated as forjd-hermes-bot
✓ paired workspace: forjd
✓ opened outbound websocket

listening for jobs...
→ job_8K2P issue_comment forjd/browse
→ running hermes --skills github-issues
→ streamed 48 log lines
✓ posted final response to GitHub`}</pre>
        </div>
        <div className="daemonCopy">
          <span className="kicker">Local-first agent runtime</span>
          <h2>The relay never needs inbound access to your laptop or server.</h2>
          <ul>
            <li><Check size={16} /> WebSocket initiated from the user's machine</li>
            <li><Check size={16} /> GitHub App tokens stay server-side for comments/statuses</li>
            <li><Check size={16} /> Local secrets, CLIs, and repo checkouts stay local</li>
            <li><Check size={16} /> Supports Hermes first, then pluggable agent adapters</li>
          </ul>
        </div>
      </section>

      <section className="architecture">
        <div className="archNode"><GitPullRequest /> GitHub App</div>
        <ArrowRight className="archArrow" />
        <div className="archNode"><Workflow /> AgentLink Relay</div>
        <ArrowRight className="archArrow" />
        <div className="archNode"><RadioTower /> Outbound WS</div>
        <ArrowRight className="archArrow" />
        <div className="archNode"><Bot /> Local Agent</div>
      </section>

      <footer>
        <div><Lock size={15} /> Private beta mockup</div>
        <div className="footerLinks"><span>GitHub App</span><span>Relay</span><span>Daemon</span><span>Adapters</span></div>
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
