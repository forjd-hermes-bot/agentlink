import { program } from 'commander';
import { loadConfig } from '../core/config';
import type { AgentLinkEvent, RouteConfig } from '../core/types';
import { runLocalAdapter } from './adapters';

function websocketUrl(relayUrl: string, workspace: string, adapter: string, token?: string): string {
  const url = new URL('/ws', relayUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('workspace', workspace);
  url.searchParams.set('adapter', adapter);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

function routeForAdapter(routes: RouteConfig[], adapterId: string): RouteConfig | undefined {
  return routes.find((route) => route.adapter.type === adapterId || (route.adapter.type === 'websocket' && route.adapter.adapter_id === adapterId));
}

async function connect(options: { config: string; relay: string; adapter: string; token?: string }) {
  const config = loadConfig(options.config);
  const adapterId = options.adapter;
  const route = routeForAdapter(config.routes, adapterId);
  if (!route) throw new Error(`No local route configured for adapter: ${adapterId}`);
  if (route.adapter.type === 'websocket') throw new Error('Cannot execute websocket adapter locally; choose command/hermes/openclaw/http route');

  const url = websocketUrl(options.relay, config.workspace_id, adapterId, options.token ?? config.relay.daemon_token);
  console.log(`AgentLink daemon connecting ${adapterId} → ${url.replace(/token=[^&]+/, 'token=REDACTED')}`);
  const ws = new WebSocket(url);

  ws.addEventListener('open', () => console.log('AgentLink daemon connected'));
  ws.addEventListener('close', () => console.log('AgentLink daemon disconnected'));
  ws.addEventListener('error', (event) => console.error('AgentLink WebSocket error', event));
  ws.addEventListener('message', async (message) => {
    const parsed = JSON.parse(String(message.data));
    if (parsed.type === 'ready') {
      console.log(`Relay ready for ${parsed.workspace_id}/${parsed.adapter_id}`);
      return;
    }
    if (parsed.type !== 'event') return;

    const event = parsed.event as AgentLinkEvent;
    console.log(`Received ${event.event}:${event.action ?? 'unknown'} for ${event.repository.full_name}`);
    const result = await runLocalAdapter(route.adapter, event);
    ws.send(JSON.stringify({ type: 'result', event, result }));
  });
}

program
  .name('agentlink')
  .description('GitHub event bridge daemon for AI agents and bots')
  .command('connect')
  .requiredOption('-a, --adapter <adapter>', 'adapter id/type to connect, e.g. hermes, openclaw, command')
  .option('-c, --config <path>', 'config path', 'agentlink.config.json')
  .option('-r, --relay <url>', 'relay HTTP URL', 'http://127.0.0.1:8787')
  .option('-t, --token <token>', 'daemon token')
  .action(connect);

program.parse();
