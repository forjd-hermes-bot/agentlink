# AgentLink

A GitHub event bridge for AI agents and bots.

AgentLink makes it easy for tools like **Hermes Agent**, **OpenClaw**, **Codex**, **Claude Code**, **OpenCode**, and custom bots to receive GitHub events such as PR comments, issue comments, new issues, reviews, labels, and CI failures — without each agent needing to implement GitHub Apps, webhook hosting, signature verification, event filtering, or public endpoints.

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

## Current status

This repo now contains both:

- a **Bun + React product mockup** for the dashboard/landing page
- a functional **MVP relay + daemon implementation** for Option A:
  - hosted relay HTTP server
  - GitHub webhook signature verification
  - GitHub event normalization into `agentlink.event.v1`
  - trigger route matching
  - outbound WebSocket delivery to a local daemon
  - command/Hermes/OpenClaw/local HTTP adapter execution
  - adapter result parsing
  - GitHub comment posting abstraction

This is still an early MVP, not production SaaS infrastructure yet.

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

## Architecture

```txt
┌────────────┐      ┌────────────────────┐      ┌──────────────────┐
│  GitHub    │─────▶│ AgentLink Relay     │─────▶│ Local Daemon      │
│  Webhooks  │      │ /webhooks/github    │  WS  │ command/http/etc. │
└────────────┘      └────────────────────┘      └──────────────────┘
                            │                            │
                            │                            ▼
                            │                  Hermes / OpenClaw / bot
                            ▼
                    GitHub comments/statuses
```

## Configuration

Copy the example config:

```bash
cp agentlink.config.example.json agentlink.config.json
```

Then edit:

- `github.webhook_secret` — GitHub App webhook secret
- `github.token` — optional GitHub token for MVP comment posting
- `relay.daemon_token` — shared token for daemon WebSocket auth
- `routes` — event filters and adapter configuration

Example route:

```json
{
  "id": "command-demo",
  "repos": ["*"],
  "events": ["issue_comment"],
  "when": {
    "body_contains": "@agentlink-demo"
  },
  "adapter": {
    "type": "command",
    "command": "node examples/echo-agent.mjs"
  },
  "allowed_actions": ["comment"]
}
```

## Running the relay

```bash
bun install
bun run relay
```

Relay endpoints:

- `GET /health`
- `POST /webhooks/github`
- `GET /ws?workspace=...&adapter=...&token=...`
- `POST /adapter/results`

For local webhook development, point GitHub at a public tunnel or deploy the relay somewhere public. In the final product, this relay is the hosted AgentLink Cloud component.

## Running the daemon

The daemon connects outbound to the relay and executes the matching local adapter.

```bash
bun run daemon -- connect \
  --config agentlink.config.json \
  --relay http://127.0.0.1:8787 \
  --adapter command \
  --token change-me-daemon-token
```

For Hermes:

```bash
bun run daemon -- connect --adapter hermes --relay https://agentlink.example.com --token "$AGENTLINK_DAEMON_TOKEN"
```

For OpenClaw:

```bash
bun run daemon -- connect --adapter openclaw --relay https://agentlink.example.com --token "$AGENTLINK_DAEMON_TOKEN"
```

## Adapter contract

Adapters receive a normalized event JSON on stdin or HTTP POST.

They can return structured JSON:

```json
{
  "actions": [
    {
      "type": "comment",
      "body": "Done — I looked at this."
    }
  ]
}
```

Plain text stdout is treated as a GitHub comment action.

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

## GitHub App setup

MVP webhook events:

- Issues
- Issue comments
- Pull requests
- Pull request reviews
- Pull request review comments
- Check runs / suites
- Workflow runs

Suggested MVP permissions:

- Metadata: read
- Issues: read/write for comments
- Pull requests: read/write for PR comments/reviews
- Contents: read if agents need repo context
- Checks: read if routing on CI events

Set the webhook URL to:

```txt
https://YOUR-RELAY-HOST/webhooks/github
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
- GitHub App tokens should stay server-side when posting comments/statuses/reviews.

MVP caveat: `github.token` is a simple token-based comment poster for development. Production should use GitHub App installation tokens.

## Development

Requires [Bun](https://bun.sh/).

```bash
bun install
bun run dev
```

Test/build:

```bash
bun test
bun run typecheck
bun run build
```

## License

MIT
