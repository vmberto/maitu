import { calendarDate, zonedInstant, validSchedule, validReminder, matchesDate, scheduleGroup, scheduleLabel } from './scheduling';
import { validateData, publicEntity } from './sync-server';
import type { Task } from '../../types/main';
const task = (date?: string, time?: string, timeZone = 'America/Recife') => ({ schedule: date ? { date, ...(time ? { time } : {}), timeZone } : null }) as Task;

it('keeps undated tasks in All and separates future, today and overdue tasks', () => {
  const now = new Date('2026-10-14T15:00:00Z'), zone = 'America/Recife';
  expect(matchesDate(task(), 'all', now, zone)).toBe(true);
  expect(matchesDate(task(), 'today', now, zone)).toBe(false);
  expect(scheduleGroup(task(), now, zone)).toBe('unscheduled');
  expect(scheduleGroup(task('2026-10-21'), now, zone)).toBe('upcoming');
  expect(scheduleGroup(task('2026-10-14'), now, zone)).toBe('today');
  expect(scheduleGroup(task('2026-10-14', '11:00'), now, zone)).toBe('overdue');
  expect(scheduleGroup(task('2026-10-13'), now, zone)).toBe('overdue');
  expect(scheduleLabel(task('2026-10-15').schedule!, now, zone)).toBe('Tomorrow');
});
it('uses calendar weeks and months across year boundaries, rather than rolling windows', () => {
  const now = new Date('2027-01-01T02:00:00Z'), zone = 'America/Recife'; // still December 31
  expect(calendarDate(now, zone)).toBe('2026-12-31');
  expect(matchesDate(task('2027-01-03'), 'week', now, zone)).toBe(true);
  expect(matchesDate(task('2027-01-04'), 'week', now, zone)).toBe(false);
  expect(matchesDate(task('2026-12-01'), 'month', now, zone)).toBe(true);
  expect(matchesDate(task('2027-01-01'), 'month', now, zone)).toBe(false);
  expect(matchesDate(task('2027-01-01'), 'upcoming', now, zone)).toBe(true);
});
it('preserves date-only days but converts timed tasks into the viewer timezone', () => {
  const now = new Date('2026-10-14T15:00:00Z');
  expect(matchesDate(task('2026-10-15'), 'today', now, 'America/Recife')).toBe(false);
  expect(matchesDate(task('2026-10-15', '00:30', 'Asia/Tokyo'), 'today', now, 'America/Recife')).toBe(true);
  expect(zonedInstant('2026-10-14', '09:00', 'America/Recife')).toBe('2026-10-14T12:00:00.000Z');
});
it('rejects nonexistent DST times and deterministically picks the earlier repeated time', () => {
  expect(() => zonedInstant('2026-03-08', '02:30', 'America/New_York')).toThrow('does not exist');
  expect(zonedInstant('2026-11-01', '01:30', 'America/New_York')).toBe('2026-11-01T05:30:00.000Z');
  expect(zonedInstant('2026-10-04', '02:45', 'Australia/Lord_Howe')).toBe('2026-10-03T15:45:00.000Z');
});
it('validates stored scheduling and reminders at the API boundary', () => {
  expect(validSchedule({ date: '2026-02-30', timeZone: 'UTC' })).toBe(false);
  expect(validSchedule({ date: '2026-10-14', time: '25:00', timeZone: 'UTC' })).toBe(false);
  expect(validSchedule({ date: '2026-10-14', timeZone: 'fake/timezone' })).toBe(false);
  expect(() => validateData('tasks', { schedule: { date: '2026-10-14', timeZone: 'UTC', injected: 1 } }, false)).toThrow('Invalid schedule');
  const reminder = { id: '00000000-0000-4000-8000-000000000001', at: '2026-10-14T12:00:00.000Z', timeZone: 'America/Recife' };
  expect(validReminder(reminder)).toBe(true);
  expect(validReminder({ ...reminder, at: '2026-02-30T12:00:00.000Z' })).toBe(false);
  expect(validateData('tasks', { schedule: null, reminder }, false)).toEqual({ schedule: null, reminder });
  expect(publicEntity({ _id: 'task', schedule: task('2026-10-14').schedule, reminder, _reminderFinished: reminder.id })).toMatchObject({ schedule: task('2026-10-14').schedule, reminder });
  expect(publicEntity({ _id: 'task', _reminderFinished: reminder.id })).not.toHaveProperty('_reminderFinished');
});
