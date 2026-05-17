import { z } from 'zod/v4';

export const TargetKindSchema = z.enum(['issue', 'pull_request', 'repository', 'check', 'workflow']);
export type TargetKind = z.infer<typeof TargetKindSchema>;

export const AgentLinkEventSchema = z.object({
  schema: z.literal('agentlink.event.v1'),
  id: z.string().min(1),
  source: z.literal('github'),
  event: z.string().min(1),
  action: z.string().optional(),
  delivery_id: z.string().min(1),
  installation_id: z.number().optional(),
  repository: z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
    full_name: z.string().min(1),
    default_branch: z.string().optional(),
    url: z.string().optional(),
  }),
  actor: z.object({
    login: z.string().min(1),
    type: z.string().optional(),
    url: z.string().optional(),
  }),
  target: z.object({
    kind: TargetKindSchema,
    number: z.number().optional(),
    title: z.string().optional(),
    url: z.string().optional(),
  }),
  message: z.object({
    id: z.number().optional(),
    body: z.string().optional(),
    url: z.string().optional(),
    path: z.string().optional(),
    line: z.number().optional(),
  }).optional(),
  route: z.object({
    id: z.string(),
    adapter: z.string(),
    allowed_actions: z.array(z.string()).default([]),
  }).optional(),
});

export type AgentLinkEvent = z.infer<typeof AgentLinkEventSchema>;

export const AdapterConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('command'), command: z.string().min(1), timeout_ms: z.number().optional() }),
  z.object({ type: z.literal('hermes'), command: z.string().default('hermes chat -q'), timeout_ms: z.number().optional() }),
  z.object({ type: z.literal('openclaw'), command: z.string().default('openclaw'), timeout_ms: z.number().optional() }),
  z.object({ type: z.literal('http'), url: z.string().url(), timeout_ms: z.number().optional() }),
  z.object({ type: z.literal('websocket'), adapter_id: z.string().min(1) }),
]);
export type AdapterConfig = z.infer<typeof AdapterConfigSchema>;

export const RouteConfigSchema = z.object({
  id: z.string().min(1),
  repos: z.array(z.string()).default(['*']),
  events: z.array(z.string()).default(['*']),
  when: z.object({
    body_contains: z.string().optional(),
    target_kind: TargetKindSchema.optional(),
    actor: z.string().optional(),
  }).default({}),
  adapter: AdapterConfigSchema,
  allowed_actions: z.array(z.string()).default(['comment']),
});
export type RouteConfig = z.infer<typeof RouteConfigSchema>;

export const AgentLinkConfigSchema = z.object({
  workspace_id: z.string().default('default'),
  github: z.object({
    webhook_secret: z.string().min(1),
    app_id: z.string().optional(),
    private_key_path: z.string().optional(),
    token: z.string().optional(),
  }),
  relay: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.number().default(8787),
    daemon_token: z.string().optional(),
  }).default({ host: '0.0.0.0', port: 8787 }),
  routes: z.array(RouteConfigSchema).default([]),
});
export type AgentLinkConfig = z.infer<typeof AgentLinkConfigSchema>;

export const AdapterActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('comment'), body: z.string().min(1) }),
  z.object({ type: z.literal('noop'), reason: z.string().optional() }),
]);
export type AdapterAction = z.infer<typeof AdapterActionSchema>;

export const AdapterResultSchema = z.object({
  actions: z.array(AdapterActionSchema).default([]),
  logs: z.array(z.string()).default([]),
});
export type AdapterResult = z.infer<typeof AdapterResultSchema>;
