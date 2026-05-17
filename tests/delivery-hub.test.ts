import { describe, expect, it } from 'bun:test';
import { DeliveryHub } from '../src/relay/delivery-hub';
import type { AgentLinkEvent } from '../src/core/types';

const event: AgentLinkEvent = {
  schema: 'agentlink.event.v1',
  id: 'evt_test',
  source: 'github',
  event: 'issues',
  action: 'opened',
  delivery_id: 'delivery-123',
  repository: { owner: 'forjd', name: 'browse', full_name: 'forjd/browse', default_branch: 'main', url: 'https://github.com/forjd/browse' },
  actor: { login: 'dan9571', type: 'User' },
  target: { kind: 'issue', number: 1, title: 'Bug', url: 'https://github.com/forjd/browse/issues/1' },
};

describe('DeliveryHub', () => {
  it('queues events until an adapter session connects', () => {
    const hub = new DeliveryHub();
    hub.enqueue('workspace-1', 'hermes', event);

    const received: AgentLinkEvent[] = [];
    hub.register('workspace-1', 'hermes', (queuedEvent) => received.push(queuedEvent));

    expect(received).toEqual([event]);
    expect(hub.pendingCount('workspace-1', 'hermes')).toBe(0);
  });
});
