import { describe, expect, it } from 'bun:test';
import { matchesRoute } from '../src/core/routes';
import type { AgentLinkEvent, RouteConfig } from '../src/core/types';

const event: AgentLinkEvent = {
  schema: 'agentlink.event.v1',
  id: 'evt_test',
  source: 'github',
  event: 'issue_comment',
  action: 'created',
  delivery_id: 'delivery-123',
  installation_id: 42,
  repository: { owner: 'forjd', name: 'browse', full_name: 'forjd/browse', default_branch: 'main', url: 'https://github.com/forjd/browse' },
  actor: { login: 'dan9571', type: 'User', url: 'https://github.com/dan9571' },
  target: { kind: 'pull_request', number: 247, title: 'Compare browser backends', url: 'https://github.com/forjd/browse/pull/247' },
  message: { body: '@agentlink research this', url: 'https://github.com/forjd/browse/pull/247#issuecomment-99' },
};

describe('matchesRoute', () => {
  it('matches repo globs, event names, body contains, and target kind', () => {
    const route: RouteConfig = {
      id: 'mentions',
      repos: ['forjd/*'],
      events: ['issue_comment'],
      when: { body_contains: '@agentlink', target_kind: 'pull_request' },
      adapter: { type: 'command', command: 'cat' },
      allowed_actions: ['comment'],
    };

    expect(matchesRoute(route, event)).toBe(true);
  });

  it('does not match when body, repo, or event filters fail', () => {
    const route: RouteConfig = {
      id: 'mentions',
      repos: ['other/*'],
      events: ['pull_request'],
      when: { body_contains: '@openclaw' },
      adapter: { type: 'command', command: 'cat' },
      allowed_actions: ['comment'],
    };

    expect(matchesRoute(route, event)).toBe(false);
  });
});
