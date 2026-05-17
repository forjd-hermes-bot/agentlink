import type { AgentLinkEvent, RouteConfig } from './types';

function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

function anyMatch(patterns: string[], value: string): boolean {
  return patterns.includes('*') || patterns.some((pattern) => globToRegex(pattern).test(value));
}

export function matchesRoute(route: RouteConfig, event: AgentLinkEvent): boolean {
  if (!anyMatch(route.repos, event.repository.full_name)) return false;
  if (!anyMatch(route.events, event.event)) return false;

  if (route.when.body_contains) {
    const body = event.message?.body ?? '';
    if (!body.toLowerCase().includes(route.when.body_contains.toLowerCase())) return false;
  }

  if (route.when.target_kind && event.target.kind !== route.when.target_kind) return false;
  if (route.when.actor && event.actor.login !== route.when.actor) return false;

  return true;
}

export function applyRoute(event: AgentLinkEvent, route: RouteConfig): AgentLinkEvent {
  return {
    ...event,
    route: {
      id: route.id,
      adapter: route.adapter.type === 'websocket' ? route.adapter.adapter_id : route.adapter.type,
      allowed_actions: route.allowed_actions,
    },
  };
}

export function matchingRoutes(routes: RouteConfig[], event: AgentLinkEvent): RouteConfig[] {
  return routes.filter((route) => matchesRoute(route, event));
}
