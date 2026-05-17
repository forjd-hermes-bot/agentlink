import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { AgentLinkConfigSchema, type AgentLinkConfig } from './types';

export function loadConfig(path = process.env.AGENTLINK_CONFIG ?? 'agentlink.config.json'): AgentLinkConfig {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    throw new Error(`AgentLink config not found: ${resolved}`);
  }
  const raw = JSON.parse(readFileSync(resolved, 'utf8'));
  return AgentLinkConfigSchema.parse(raw);
}
