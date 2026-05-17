import { createHmac, timingSafeEqual } from 'node:crypto';

export async function signGitHubBody(body: string, secret: string): Promise<string> {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

export async function verifyGitHubSignature(body: string, signature: string | null | undefined, secret: string): Promise<boolean> {
  if (!signature?.startsWith('sha256=')) return false;
  const expected = await signGitHubBody(body, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
