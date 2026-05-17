# AgentLink

A Bun + React mockup for a product that connects GitHub repositories to local AI agents without exposing the user's machine to the public internet.

## Concept

AgentLink is a GitHub App plus a local daemon:

```txt
GitHub App event
  → AgentLink hosted relay
  → outbound WebSocket to local daemon
  → Hermes / Codex / Claude Code / OpenCode runs locally
  → result streams back
  → relay posts GitHub comment/status/review
```

The public endpoint belongs to the SaaS relay, not the user's agent host. The daemon only makes outbound connections.

## Mockup

This repo currently contains a polished landing/dashboard prototype:

- Linear-inspired dark UI
- Trigger route dashboard
- Live jobs rail
- Local daemon terminal panel
- Architecture flow

## Development

Requires [Bun](https://bun.sh/).

```bash
bun install
bun run dev
```

Build:

```bash
bun run typecheck
bun run build
```

## Potential MVP modules

- GitHub App installation + repo selection
- Trigger route config: mentions, labels, PRs, failed CI
- Hosted job relay and queue
- Local daemon with authenticated outbound WebSocket
- Agent adapters: Hermes first, then Codex/Claude Code/OpenCode
- GitHub result posting via App tokens
