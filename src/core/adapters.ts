import { AdapterResultSchema, type AdapterResult } from './types';

export function parseAdapterResult(output: string): AdapterResult {
  const trimmed = output.trim();
  if (!trimmed) return { actions: [], logs: [] };

  try {
    const parsed = JSON.parse(trimmed);
    return AdapterResultSchema.parse(parsed);
  } catch {
    return { actions: [{ type: 'comment', body: trimmed }], logs: [] };
  }
}
