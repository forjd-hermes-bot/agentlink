import type { AgentLinkEvent } from '../core/types';

type Sink = (event: AgentLinkEvent) => void;

type Key = `${string}:${string}`;

export class DeliveryHub {
  private readonly queues = new Map<Key, AgentLinkEvent[]>();
  private readonly sinks = new Map<Key, Sink>();

  enqueue(workspaceId: string, adapterId: string, event: AgentLinkEvent): void {
    const key = this.key(workspaceId, adapterId);
    const sink = this.sinks.get(key);
    if (sink) {
      sink(event);
      return;
    }
    const queue = this.queues.get(key) ?? [];
    queue.push(event);
    this.queues.set(key, queue);
  }

  register(workspaceId: string, adapterId: string, sink: Sink): () => void {
    const key = this.key(workspaceId, adapterId);
    this.sinks.set(key, sink);
    const queue = this.queues.get(key) ?? [];
    for (const event of queue.splice(0)) sink(event);
    this.queues.set(key, queue);
    return () => {
      if (this.sinks.get(key) === sink) this.sinks.delete(key);
    };
  }

  pendingCount(workspaceId: string, adapterId: string): number {
    return this.queues.get(this.key(workspaceId, adapterId))?.length ?? 0;
  }

  private key(workspaceId: string, adapterId: string): Key {
    return `${workspaceId}:${adapterId}`;
  }
}
