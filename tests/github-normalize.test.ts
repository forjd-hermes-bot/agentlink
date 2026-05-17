import { describe, expect, it } from 'bun:test';
import { normalizeGitHubEvent } from '../src/core/github';

const repository = {
  name: 'browse',
  full_name: 'forjd/browse',
  default_branch: 'main',
  html_url: 'https://github.com/forjd/browse',
  owner: { login: 'forjd' },
};

const sender = { login: 'dan9571', type: 'User', html_url: 'https://github.com/dan9571' };

function headers(event: string) {
  return {
    'x-github-event': event,
    'x-github-delivery': 'delivery-123',
  };
}

describe('normalizeGitHubEvent', () => {
  it('normalizes issue comments on pull requests into agentlink.event.v1', () => {
    const payload = {
      action: 'created',
      repository,
      sender,
      installation: { id: 42 },
      issue: {
        number: 247,
        title: 'Compare browser backends',
        html_url: 'https://github.com/forjd/browse/pull/247',
        pull_request: { url: 'https://api.github.com/repos/forjd/browse/pulls/247' },
      },
      comment: {
        id: 99,
        body: '@agentlink research this',
        html_url: 'https://github.com/forjd/browse/pull/247#issuecomment-99',
      },
    };

    const event = normalizeGitHubEvent(headers('issue_comment'), payload);

    expect(event.schema).toBe('agentlink.event.v1');
    expect(event.source).toBe('github');
    expect(event.event).toBe('issue_comment');
    expect(event.action).toBe('created');
    expect(event.delivery_id).toBe('delivery-123');
    expect(event.installation_id).toBe(42);
    expect(event.repository.full_name).toBe('forjd/browse');
    expect(event.actor.login).toBe('dan9571');
    expect(event.target).toMatchObject({ kind: 'pull_request', number: 247, title: 'Compare browser backends' });
    expect(event.message?.body).toBe('@agentlink research this');
  });

  it('normalizes pull request review comments', () => {
    const payload = {
      action: 'created',
      repository,
      sender,
      installation: { id: 42 },
      pull_request: {
        number: 12,
        title: 'Add auth',
        html_url: 'https://github.com/forjd/browse/pull/12',
      },
      comment: {
        id: 777,
        body: '@openclaw explain this function',
        html_url: 'https://github.com/forjd/browse/pull/12#discussion_r777',
        path: 'src/auth.ts',
        line: 88,
      },
    };

    const event = normalizeGitHubEvent(headers('pull_request_review_comment'), payload);

    expect(event.target).toMatchObject({ kind: 'pull_request', number: 12 });
    expect(event.message).toMatchObject({ body: '@openclaw explain this function', path: 'src/auth.ts', line: 88 });
  });

  it('rejects unsupported events', () => {
    expect(() => normalizeGitHubEvent(headers('star'), { action: 'created', repository, sender })).toThrow('Unsupported GitHub event');
  });
});
