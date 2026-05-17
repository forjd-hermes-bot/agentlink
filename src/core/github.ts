import { AgentLinkEventSchema, type AgentLinkEvent } from './types';

const SUPPORTED_EVENTS = new Set([
  'issue_comment',
  'issues',
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'check_run',
  'check_suite',
  'workflow_run',
]);

type HeadersLike = Record<string, string | undefined> | Headers;

function header(headers: HeadersLike, name: string): string | undefined {
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  return headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
}

function idFromDelivery(deliveryId: string): string {
  return `evt_${deliveryId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || crypto.randomUUID().replace(/-/g, '')}`;
}

function repositoryFrom(payload: any) {
  const repo = payload.repository ?? {};
  const fullName = String(repo.full_name ?? `${repo.owner?.login ?? 'unknown'}/${repo.name ?? 'unknown'}`);
  const [owner, name] = fullName.split('/');
  return {
    owner: String(repo.owner?.login ?? owner),
    name: String(repo.name ?? name),
    full_name: fullName,
    default_branch: repo.default_branch ? String(repo.default_branch) : undefined,
    url: repo.html_url ? String(repo.html_url) : undefined,
  };
}

function actorFrom(payload: any) {
  const sender = payload.sender ?? {};
  return {
    login: String(sender.login ?? 'unknown'),
    type: sender.type ? String(sender.type) : undefined,
    url: sender.html_url ? String(sender.html_url) : undefined,
  };
}

function targetFrom(eventName: string, payload: any): AgentLinkEvent['target'] {
  if (eventName === 'issue_comment') {
    const issue = payload.issue ?? {};
    return {
      kind: issue.pull_request ? 'pull_request' : 'issue',
      number: typeof issue.number === 'number' ? issue.number : undefined,
      title: issue.title ? String(issue.title) : undefined,
      url: issue.html_url ? String(issue.html_url) : undefined,
    };
  }

  if (eventName === 'issues') {
    const issue = payload.issue ?? {};
    return {
      kind: 'issue',
      number: typeof issue.number === 'number' ? issue.number : undefined,
      title: issue.title ? String(issue.title) : undefined,
      url: issue.html_url ? String(issue.html_url) : undefined,
    };
  }

  if (eventName === 'pull_request' || eventName === 'pull_request_review' || eventName === 'pull_request_review_comment') {
    const pr = payload.pull_request ?? {};
    return {
      kind: 'pull_request',
      number: typeof pr.number === 'number' ? pr.number : undefined,
      title: pr.title ? String(pr.title) : undefined,
      url: pr.html_url ? String(pr.html_url) : undefined,
    };
  }

  if (eventName === 'check_run' || eventName === 'check_suite') {
    const check = payload.check_run ?? payload.check_suite ?? {};
    return {
      kind: 'check',
      title: check.name ? String(check.name) : eventName,
      url: check.html_url ? String(check.html_url) : undefined,
    };
  }

  if (eventName === 'workflow_run') {
    const workflow = payload.workflow_run ?? {};
    return {
      kind: 'workflow',
      title: workflow.name ? String(workflow.name) : 'workflow_run',
      url: workflow.html_url ? String(workflow.html_url) : undefined,
    };
  }

  return { kind: 'repository', url: payload.repository?.html_url };
}

function messageFrom(eventName: string, payload: any): AgentLinkEvent['message'] | undefined {
  const comment = payload.comment ?? payload.review ?? undefined;
  if (!comment) return undefined;
  return {
    id: typeof comment.id === 'number' ? comment.id : undefined,
    body: comment.body ? String(comment.body) : undefined,
    url: comment.html_url ? String(comment.html_url) : undefined,
    path: comment.path ? String(comment.path) : undefined,
    line: typeof comment.line === 'number' ? comment.line : undefined,
  };
}

export function normalizeGitHubEvent(headers: HeadersLike, payload: unknown): AgentLinkEvent {
  const eventName = header(headers, 'x-github-event');
  const deliveryId = header(headers, 'x-github-delivery');
  if (!eventName || !deliveryId) throw new Error('Missing GitHub event headers');
  if (!SUPPORTED_EVENTS.has(eventName)) throw new Error(`Unsupported GitHub event: ${eventName}`);

  const input = payload as any;
  const event = {
    schema: 'agentlink.event.v1' as const,
    id: idFromDelivery(deliveryId),
    source: 'github' as const,
    event: eventName,
    action: input.action ? String(input.action) : undefined,
    delivery_id: deliveryId,
    installation_id: typeof input.installation?.id === 'number' ? input.installation.id : undefined,
    repository: repositoryFrom(input),
    actor: actorFrom(input),
    target: targetFrom(eventName, input),
    message: messageFrom(eventName, input),
  };

  return AgentLinkEventSchema.parse(event);
}
