import { createHash } from 'node:crypto';
import { ObjectId, type Db } from 'mongodb';
import { nextOccurrence, validRecurrence } from './recurrence';
import { calendarDate, shiftDate } from './scheduling';

// Stable occurrence IDs make a retry safe even if a run stops before advancing the series.
export async function generateRecurringTasks(db: Db, now = new Date()) {
  const started = Date.now();
  const tasks = db.collection('todos'), lists = db.collection('lists');
  await tasks.createIndex({ 'recurrence.nextDate': 1, _recurrenceCheckedAt: 1 });
  const sources = await tasks.find({ deleted: { $ne: true }, archived: { $ne: true }, type: { $ne: 'note' },
    'recurrence.nextDate': { $lte: shiftDate(calendarDate(now, 'UTC'), 1) },
  }).sort({ _recurrenceCheckedAt: 1, 'recurrence.nextDate': 1 }).limit(100).toArray();
  let created = 0, processed = 0;
  for (const source of sources) {
    if (Date.now() - started >= 20000) break;
    await tasks.updateOne({ _id: source._id }, { $set: { _recurrenceCheckedAt: now } });
    if (!validRecurrence(source.recurrence)) continue;
    const rule = source.recurrence;
    const list = await lists.findOne({ _id: source.listId, deleted: { $ne: true }, archived: { $ne: true },
      ...(!source.parentTaskId ? { type: { $nin: ['notes', 'timeline'] } } : {}),
    });
    if (!list) continue;
    if (source.parentTaskId && !await tasks.findOne({ _id: source.parentTaskId, listId: source.listId, deleted: { $ne: true }, archived: { $ne: true } })) continue;
    const unfinished = await tasks.find({ listId: source.listId, complete: { $ne: true }, deleted: { $ne: true }, archived: { $ne: true } }, { projection: { title: 1 } }).toArray();
    const names = new Set(unfinished.map((task) => task.title));
    let date = rule.nextDate;
    while (date <= calendarDate(now, rule.timeZone) && processed < 100 && Date.now() - started < 20000) {
      const current = { _id: source._id, version: source.version ?? 0, deleted: { $ne: true }, archived: { $ne: true }, recurrence: { ...rule, nextDate: date } };
      if (!await tasks.findOne(current)) break;
      let title = source.title, number = 2;
      while (names.has(title)) title = `${source.title.slice(0, 9980)} ${number++}`;
      const id = new ObjectId(createHash('sha256').update(`${source._id}:${date}`).digest('hex').slice(0, 24));
      const addons = (source.addons ?? []).filter((addon: string) => !['recurrence', 'relatedTasks', 'scheduling'].includes(addon));
      const result = await tasks.updateOne({ _id: id }, { $setOnInsert: {
        _id: id, listId: source.listId, owner: list.owner, parentTaskId: source.parentTaskId ?? null,
        title, description: source.description ?? '', tags: source.tags ?? [], location: source.location ?? null,
        addons: [...addons, 'scheduling'], type: 'task', complete: false, archived: false, deleted: false,
        createdAt: now.toISOString(), schedule: { date, timeZone: rule.timeZone }, wasScheduled: true, version: 1,
      } }, { upsert: true });
      if (result.upsertedCount) { created++; names.add(title); }
      const nextDate = nextOccurrence(date, rule.dayOfMonth);
      const advanced = await tasks.updateOne(current, { $set: { 'recurrence.nextDate': nextDate }, $inc: { version: 1 } });
      processed++;
      if (!advanced.matchedCount) break;
      source.version = (source.version ?? 0) + 1;
      date = nextDate;
    }
    if (processed >= 100) break;
  }
  return { created };
}
