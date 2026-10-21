import { nextOccurrence, validRecurrence } from './recurrence';
import { validateData } from './sync-server';

it('uses the final day of short months without changing the selected monthly day', () => {
  expect(nextOccurrence('2026-01-31', 31)).toBe('2026-02-28');
  expect(nextOccurrence('2026-02-28', 31)).toBe('2026-03-31');
  expect(nextOccurrence('2028-01-31', 31)).toBe('2028-02-29');
  expect(nextOccurrence('2026-03-31', 31)).toBe('2026-04-30');
  expect(nextOccurrence('2026-12-31', 31)).toBe('2027-01-31');
  expect(nextOccurrence('2026-10-20', 21)).toBe('2026-10-21');
  expect(nextOccurrence('2026-10-20', 20)).toBe('2026-11-20');
});
it('validates recurrence at the sync boundary', () => {
  const rule = { dayOfMonth: 31, nextDate: '2026-10-31', timeZone: 'America/Recife' };
  expect(validateData('tasks', { recurrence: rule, addons: ['location', 'relatedTasks', 'scheduling', 'recurrence'] }, false).recurrence).toEqual(rule);
  expect(validateData('tasks', { recurrence: null }, false)).toEqual({ recurrence: null });
  for (const value of [{ ...rule, dayOfMonth: 0 }, { ...rule, dayOfMonth: 32 }, { ...rule, dayOfMonth: 1.5 }, { ...rule, timeZone: 'invalid' }, { ...rule, nextDate: '2026-02-31' }, { ...rule, extra: true }, { ...rule, nextDate: '2026-10-20' }]) {
    expect(validRecurrence(value)).toBe(false);
    expect(() => validateData('tasks', { recurrence: value }, false)).toThrow('Invalid recurrence');
  }
});
