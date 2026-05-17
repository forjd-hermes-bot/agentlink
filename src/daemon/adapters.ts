import { parseAdapterResult } from '../core/adapters';
import type { AdapterConfig, AgentLinkEvent, AdapterResult } from '../core/types';

function shellCommand(command: string): string[] {
  return ['bash', '-lc', command];
}

export async function runCommandAdapter(config: Extract<AdapterConfig, { type: 'command' | 'hermes' | 'openclaw' }>, event: AgentLinkEvent): Promise<AdapterResult> {
  const timeoutMs = config.timeout_ms ?? 120_000;
  const command = config.command;
  const proc = Bun.spawn(shellCommand(command), {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      AGENTLINK_EVENT_ID: event.id,
      AGENTLINK_REPOSITORY: event.repository.full_name,
      AGENTLINK_EVENT: event.event,
    },
  });

  proc.stdin.write(JSON.stringify(event, null, 2));
  proc.stdin.end();

  const timeout = setTimeout(() => proc.kill(), timeoutMs);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]).finally(() => clearTimeout(timeout));

  if (exitCode !== 0) {
    return {
      actions: [{ type: 'comment', body: `AgentLink adapter failed with exit code ${exitCode}.\n\n\`\`\`\n${stderr.slice(0, 4000)}\n\`\`\`` }],
      logs: [stderr],
    };
  }

  const result = parseAdapterResult(stdout);
  if (stderr.trim()) result.logs.push(stderr.trim());
  return result;
}

export async function runHttpAdapter(config: Extract<AdapterConfig, { type: 'http' }>, event: AgentLinkEvent): Promise<AdapterResult> {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  });
  const text = await response.text();
  if (!response.ok) {
    return {
      actions: [{ type: 'comment', body: `AgentLink HTTP adapter failed: ${response.status}\n\n${text.slice(0, 4000)}` }],
      logs: [text],
    };
  }
  return parseAdapterResult(text);
}

export async function runLocalAdapter(config: AdapterConfig, event: AgentLinkEvent): Promise<AdapterResult> {
  if (config.type === 'command' || config.type === 'hermes' || config.type === 'openclaw') {
    return runCommandAdapter(config, event);
  }
  if (config.type === 'http') return runHttpAdapter(config, event);
  throw new Error(`Adapter ${config.type} is delivered by the relay WebSocket, not locally executable`);
}
