import { describe, expect, it } from 'bun:test';
import { signGitHubBody, verifyGitHubSignature } from '../src/core/security';

describe('GitHub webhook signature verification', () => {
  it('accepts valid sha256 signatures', async () => {
    const secret = 'super-secret';
    const body = JSON.stringify({ action: 'created' });
    const signature = await signGitHubBody(body, secret);

    expect(await verifyGitHubSignature(body, signature, secret)).toBe(true);
  });

  it('rejects invalid signatures', async () => {
    const body = JSON.stringify({ action: 'created' });

    expect(await verifyGitHubSignature(body, 'sha256=bad', 'super-secret')).toBe(false);
  });
});
