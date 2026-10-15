import type { Task, TaskSchedule, TaskReminder } from '../../types/main';

export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'upcoming';
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string) {
  let value = formatters.get(timeZone);
  if (!value) {
    value = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    formatters.set(timeZone, value);
  }
  return value;
}
export function validZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || zone.length > 100) return false;
  try { formatter(zone); return true; } catch { return false; }
}
export function calendarDate(now: Date, timeZone: string) {
  const parts = formatter(timeZone).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function validDate(date: unknown): date is string {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= '2000-01-01' && date <= '9999-12-31' &&
    Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}
function wallTime(at: number, zone: string) {
  const parts = formatter(zone).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
}
// Resolve wall-clock input without depending on the server's timezone. Ambiguous DST times use the earlier instant.
export function zonedInstant(date: string, time: string, zone: string): string {
  if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !validZone(zone)) throw new Error('Choose a valid date, time and timezone.');
  const target = Date.parse(`${date}T${time}:00Z`);
  const offsets = new Set([-36, -12, 0, 12, 36].map((hours) => {
    const probe = target + hours * 3600000;
    return wallTime(probe, zone) - probe;
  }));
  const matches = [...offsets].map((offset) => target - offset).filter((at) => wallTime(at, zone) === target);
  if (!matches.length) throw new Error('That time does not exist due to daylight saving. Choose another time.');
  return new Date(Math.min(...matches)).toISOString();
}
export function validSchedule(value: unknown): value is TaskSchedule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as TaskSchedule;
  if (!validDate(v.date) || !validZone(v.timeZone) || Object.keys(v).some((key) => !['date', 'time', 'timeZone'].includes(key))) return false;
  if (v.time === undefined) return true;
  try { zonedInstant(v.date, v.time, v.timeZone); return true; } catch { return false; }
}
export function validReminder(value: unknown): value is TaskReminder {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as TaskReminder;
  return typeof v.id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v.id) &&
    typeof v.at === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/.test(v.at) && Number.isFinite(Date.parse(v.at)) &&
    new Date(v.at).toISOString() === v.at && validZone(v.timeZone) && Object.keys(v).every((key) => ['id', 'at', 'timeZone'].includes(key));
}
export function scheduledDate(schedule: TaskSchedule, zone: string) {
  return schedule.time ? calendarDate(new Date(zonedInstant(schedule.date, schedule.time, schedule.timeZone)), zone) : schedule.date;
}
export function scheduleGroup(task: Task, now: Date, zone: string) {
  if (!task.schedule) return 'unscheduled';
  const date = scheduledDate(task.schedule, zone), today = calendarDate(now, zone);
  if (date < today || (task.schedule.time && Date.parse(zonedInstant(task.schedule.date, task.schedule.time, task.schedule.timeZone)) < now.getTime())) return 'overdue';
  return date === today ? 'today' : 'upcoming';
}
export function matchesDate(task: Task, filter: DateFilter, now: Date, zone: string) {
  if (filter === 'all') return true;
  if (!task.schedule) return false;
  const date = scheduledDate(task.schedule, zone), today = calendarDate(now, zone);
  if (filter === 'today') return date === today;
  if (filter === 'upcoming') return date > today;
  if (filter === 'month') return date.slice(0, 7) === today.slice(0, 7);
  const day = new Date(`${today}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(today, -((day + 6) % 7));
  return date >= monday && date < shiftDate(monday, 7);
}
export function scheduleLabel(schedule: TaskSchedule, now: Date, zone: string) {
  const date = scheduledDate(schedule, zone), today = calendarDate(now, zone);
  const label = date === today ? 'Today' : date === shiftDate(today, 1) ? 'Tomorrow' : new Date(`${date}T12:00:00Z`).toLocaleDateString([], { timeZone: 'UTC', month: 'short', day: 'numeric', ...(date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) });
  return label + (schedule.time ? ` · ${new Date(zonedInstant(schedule.date, schedule.time, schedule.timeZone)).toLocaleTimeString([], { timeZone: zone, hour: '2-digit', minute: '2-digit' })}` : '');
}
