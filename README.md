# AgentLink

A GitHub event bridge for AI agents and bots.

AgentLink is intended to make it easy for tools like **Hermes Agent**, **OpenClaw**, **Codex**, **Claude Code**, **OpenCode**, and custom bots to receive GitHub events such as PR comments, issue comments, new issues, reviews, labels, and CI failures — without each agent needing to implement GitHub Apps, webhook hosting, signature verification, event filtering, or public endpoints.

## Goal

Give every AI agent a simple GitHub inbox.

```txt
GitHub App event
  → AgentLink hosted relay
  → verify + normalize + filter
  → outbound WebSocket / adapter delivery
  → Hermes, OpenClaw, shell command, local HTTP service, or custom bot
  → optional response back to GitHub
```

The public webhook endpoint belongs to the AgentLink relay. Agent hosts can sit behind NAT/firewalls and only make outbound connections.

## Why

GitHub automation usually requires every bot to solve the same plumbing:

- GitHub App setup
- Webhook hosting
- Public HTTPS endpoint
- HMAC signature verification
- Installation token management
- Event filtering
- Idempotency and retries
- Mapping GitHub payloads into prompts or bot messages
- Posting comments/statuses/reviews back to GitHub

AgentLink centralizes that plumbing and exposes a simpler delivery layer for agents.

## Current repo status

This repo currently contains a **Bun + React product mockup** for the idea:

- Landing page for “GitHub events for every agent”
- Trigger route dashboard
- Example routes for Hermes Agent, OpenClaw, and local commands
- Live event/job rail
- Adapter delivery terminal panel
- Architecture flow

It is not yet a working relay/daemon implementation.

## Intended delivery targets

AgentLink should be able to route normalized GitHub events to multiple adapter types:

- **Hermes Agent adapter** — invoke Hermes with GitHub event context
- **OpenClaw adapter** — forward PR/issue events into OpenClaw
- **Local command adapter** — run a configured command with the event JSON on stdin
- **Local HTTP adapter** — POST normalized events to `localhost`
- **WebSocket adapter** — push events to a long-running local daemon
- **Custom adapter SDK** — let other bots implement `onEvent(event)`

## Example normalized event payload

```json
{
  "schema": "agentlink.event.v1",
  "id": "evt_8K2P6C4N",
  "source": "github",
  "event": "issue_comment",
  "action": "created",
  "delivery_id": "github-delivery-guid",
  "installation_id": 123456,
  "repository": {
    "owner": "forjd",
    "name": "browse",
    "full_name": "forjd/browse",
    "default_branch": "main"
  },
  "actor": {
    "login": "dan9571",
    "type": "User"
  },
  "target": {
    "kind": "pull_request",
    "number": 247,
    "title": "Compare browser automation backends",
    "url": "https://github.com/forjd/browse/pull/247"
  },
  "message": {
    "body": "@agentlink research this and suggest a path forward",
    "url": "https://github.com/forjd/browse/pull/247#issuecomment-..."
  },
  "route": {
    "id": "mention-router",
    "adapter": "hermes",
    "allowed_actions": ["read_repo", "comment", "propose_patch"]
  }
}
```

## Security model

Default posture:

- GitHub App permissions should be least-privilege.
- GitHub webhook signatures are verified by the relay.
- GitHub content is treated as untrusted input.
- Agent hosts connect outbound; no public inbound webhook is required.
- Daemon/session tokens are scoped to workspace, repos, routes, and adapters.
- Events are normalized before delivery so adapters do not need raw GitHub payload handling.
- Dangerous actions such as pushing commits, modifying workflows, or deploying should require approval.
- GitHub App tokens stay server-side when posting comments/statuses/reviews.

## Potential MVP modules

- GitHub App installation + repo selection
- Trigger route config: mentions, labels, PR reviews, issues, failed CI
- Hosted relay with webhook verification, event normalization, queueing, retries, and audit logs
- Local daemon with authenticated outbound WebSocket
- Adapter interface for Hermes Agent and OpenClaw
- Generic command/stdin adapter
- GitHub response posting via App tokens

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

## License

MIT
