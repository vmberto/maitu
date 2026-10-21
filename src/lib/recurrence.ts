import type { TaskRecurrence } from '../../types/main';
import { validSchedule } from './scheduling';

export function validRecurrence(value: unknown): value is TaskRecurrence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as TaskRecurrence;
  return Number.isInteger(v.dayOfMonth) && v.dayOfMonth >= 1 && v.dayOfMonth <= 31 &&
    validSchedule({ date: v.nextDate, timeZone: v.timeZone }) &&
    nextOccurrence(v.nextDate, v.dayOfMonth, true) === v.nextDate &&
    Object.keys(v).every((key) => ['dayOfMonth', 'nextDate', 'timeZone'].includes(key));
}

export function nextOccurrence(date: string, dayOfMonth: number, includeToday = false) {
  const month = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
  const candidate = () => {
    const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    return `${month.toISOString().slice(0, 7)}-${String(Math.min(dayOfMonth, lastDay)).padStart(2, '0')}`;
  };
  if (candidate() < date || (!includeToday && candidate() === date)) month.setUTCMonth(month.getUTCMonth() + 1);
  return candidate();
}
