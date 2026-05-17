import { describe, expect, it } from 'bun:test';
import { parseAdapterResult } from '../src/core/adapters';

describe('parseAdapterResult', () => {
  it('parses structured GitHub comment actions', () => {
    const result = parseAdapterResult(JSON.stringify({
      actions: [{ type: 'comment', body: 'Done — I looked at this.' }],
    }));

    expect(result.actions).toEqual([{ type: 'comment', body: 'Done — I looked at this.' }]);
  });

  it('treats plain text output as a comment action', () => {
    const result = parseAdapterResult('Plain response from an agent');

    expect(result.actions).toEqual([{ type: 'comment', body: 'Plain response from an agent' }]);
  });
});
