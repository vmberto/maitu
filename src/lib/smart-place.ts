import { normalizeLocation } from './location';
import type { TaskLocation } from '../../types/main';

export type SmartPlace = TaskLocation & { tags: string[] };
export function normalizeSmartPlace(value: unknown): SmartPlace | null {
  const location = normalizeLocation(value);
  if (!location) return null;
  const tags = (value as { tags?: unknown }).tags;
  return { ...location, tags: Array.isArray(tags) ? [...new Set(tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0 && tag.length <= 30).map((tag) => tag.trim()))].slice(0, 5) : [] };
}
