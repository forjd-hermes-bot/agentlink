import type { AdapterAction, AgentLinkEvent } from '../core/types';

export interface GitHubPoster {
  postComment(event: AgentLinkEvent, body: string): Promise<void>;
}

export class ConsoleGitHubPoster implements GitHubPoster {
  async postComment(event: AgentLinkEvent, body: string): Promise<void> {
    console.log(`[github:comment] ${event.repository.full_name}#${event.target.number ?? 'repo'}\n${body}`);
  }
}

export class TokenGitHubPoster implements GitHubPoster {
  constructor(private readonly token: string) {}

  async postComment(event: AgentLinkEvent, body: string): Promise<void> {
    if (!event.target.number) throw new Error('Cannot post GitHub comment: event has no issue/PR number');
    const response = await fetch(`https://api.github.com/repos/${event.repository.full_name}/issues/${event.target.number}/comments`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      throw new Error(`GitHub comment failed: ${response.status} ${await response.text()}`);
    }
  }
}

export async function postActions(poster: GitHubPoster, event: AgentLinkEvent, actions: AdapterAction[]): Promise<void> {
  for (const action of actions) {
    if (action.type === 'comment') await poster.postComment(event, action.body);
  }
}
