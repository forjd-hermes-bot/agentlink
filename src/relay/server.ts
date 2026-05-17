import { loadConfig } from '../core/config';
import { normalizeGitHubEvent } from '../core/github';
import { applyRoute, matchingRoutes } from '../core/routes';
import { verifyGitHubSignature } from '../core/security';
import type { AgentLinkConfig, AgentLinkEvent, AdapterResult } from '../core/types';
import { DeliveryHub } from './delivery-hub';
import { ConsoleGitHubPoster, postActions, TokenGitHubPoster, type GitHubPoster } from './github-poster';

interface ServerOptions {
  config: AgentLinkConfig;
  hub?: DeliveryHub;
  poster?: GitHubPoster;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function adapterIdFor(event: AgentLinkEvent): string {
  return event.route?.adapter ?? 'default';
}

export function createRelayServer({ config, hub = new DeliveryHub(), poster }: ServerOptions): ReturnType<typeof Bun.serve> {
  const githubPoster = poster ?? (config.github.token ? new TokenGitHubPoster(config.github.token) : new ConsoleGitHubPoster());
  const server = Bun.serve({
    hostname: config.relay.host,
    port: config.relay.port,
    async fetch(req, server) {
      const url = new URL(req.url);

      if (url.pathname === '/health') {
        return json({ ok: true, service: 'agentlink-relay', workspace_id: config.workspace_id });
      }

      if (url.pathname === '/ws') {
        const token = url.searchParams.get('token') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (config.relay.daemon_token && token !== config.relay.daemon_token) return json({ error: 'unauthorized' }, 401);
        const workspaceId = url.searchParams.get('workspace') ?? config.workspace_id;
        const adapterId = url.searchParams.get('adapter') ?? 'default';
        const ok = server.upgrade(req, { data: { workspaceId, adapterId } as never });
        return ok ? undefined : json({ error: 'upgrade failed' }, 400);
      }

      if (url.pathname === '/webhooks/github' && req.method === 'POST') {
        const body = await req.text();
        const signature = req.headers.get('x-hub-signature-256');
        if (!(await verifyGitHubSignature(body, signature, config.github.webhook_secret))) {
          return json({ error: 'invalid signature' }, 401);
        }

        const event = normalizeGitHubEvent(req.headers, JSON.parse(body));
        const routes = matchingRoutes(config.routes, event);
        for (const route of routes) {
          const routed = applyRoute(event, route);
          hub.enqueue(config.workspace_id, adapterIdFor(routed), routed);
        }
        return json({ ok: true, event_id: event.id, matched_routes: routes.map((route) => route.id) });
      }

      if (url.pathname === '/adapter/results' && req.method === 'POST') {
        const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (config.relay.daemon_token && token !== config.relay.daemon_token) return json({ error: 'unauthorized' }, 401);
        const payload = await req.json() as { event: AgentLinkEvent; result: AdapterResult };
        await postActions(githubPoster, payload.event, payload.result.actions);
        return json({ ok: true });
      }

      return json({ error: 'not found' }, 404);
    },
    websocket: {
      open(ws) {
        const data = ws.data as unknown as { workspaceId: string; adapterId: string };
        const unregister = hub.register(data.workspaceId, data.adapterId, (event) => {
          ws.send(JSON.stringify({ type: 'event', event }));
        });
        (ws.data as any).unregister = unregister;
        ws.send(JSON.stringify({ type: 'ready', workspace_id: data.workspaceId, adapter_id: data.adapterId }));
      },
      async message(ws, message) {
        const parsed = JSON.parse(String(message));
        if (parsed.type === 'result') {
          await postActions(githubPoster, parsed.event, parsed.result.actions);
          ws.send(JSON.stringify({ type: 'ack', event_id: parsed.event.id }));
        }
      },
      close(ws) {
        (ws.data as any).unregister?.();
      },
    },
  });
  return server;
}

if (process.argv[1]?.endsWith('src/relay/server.ts')) {
  const config = loadConfig();
  const server = createRelayServer({ config });
  console.log(`AgentLink relay listening on http://${server.hostname}:${server.port}`);
}
