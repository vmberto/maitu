import { ObjectId, type Db } from 'mongodb';
import { generateRecurringTasks } from './recurrence.server';

function database({ complete = false, listArchived = false, nextDate = '2026-10-31' } = {}) {
  const source = { _id: new ObjectId(), listId: new ObjectId(), title: 'Pay rent', complete, version: 1,
    description: 'Keep this description', tags: ['Home'], addons: ['recurrence', 'relatedTasks'],
    recurrence: { dayOfMonth: 31, nextDate, timeZone: 'America/Recife' } };
  const documents: any[] = [source];
  let failAdvance = false;
  const matches = (doc: any, filter: any) => Object.entries(filter).every(([key, value]: [string, any]) => {
    const current = doc[key];
    if (value?.$ne !== undefined) return current !== value.$ne;
    if (value instanceof ObjectId) return String(current) === String(value);
    return JSON.stringify(current) === JSON.stringify(value);
  });
  const tasks = {
    createIndex: vi.fn(),
    find: vi.fn((filter: any) => {
      const rows = filter['recurrence.nextDate'] ? documents.filter((doc) => doc.recurrence && !doc.deleted && !doc.archived && doc.type !== 'note') : documents.filter((doc) => !doc.complete && !doc.deleted && !doc.archived);
      const cursor: any = { sort: () => cursor, limit: () => cursor, toArray: async () => rows.map((doc) => ({ ...doc, ...(doc.recurrence ? { recurrence: { ...doc.recurrence } } : {}) })) };
      return cursor;
    }),
    findOne: vi.fn(async (filter) => documents.find((doc) => matches(doc, filter)) ?? null),
    updateOne: vi.fn(async (filter, update) => {
      const doc = documents.find((doc) => matches(doc, filter));
      if (update.$setOnInsert) {
        if (doc) return { upsertedCount: 0 };
        documents.push({ ...update.$setOnInsert });
        return { upsertedCount: 1 };
      }
      if (failAdvance && update.$inc) { failAdvance = false; throw new Error('Temporary failure'); }
      if (!doc) return { matchedCount: 0 };
      if (update.$set?.['recurrence.nextDate']) doc.recurrence.nextDate = update.$set['recurrence.nextDate'];
      if (update.$inc) doc.version++;
      return { matchedCount: 1 };
    }),
  };
  const lists = { findOne: vi.fn(async () => listArchived ? null : { _id: source.listId, owner: new ObjectId() }) };
  return { db: { collection: (name: string) => name === 'todos' ? tasks : lists } as unknown as Db, source, documents, tasks, lists, failNextAdvance: () => { failAdvance = true; } };
}
const midnight = new Date('2026-10-31T03:00:00Z');
it('waits for local midnight and numbers unfinished duplicates without copying recurrence', async () => {
  const { db, documents, source } = database();
  expect(await generateRecurringTasks(db, new Date('2026-10-31T02:59:59Z'))).toEqual({ created: 0 });
  expect(await generateRecurringTasks(db, midnight)).toEqual({ created: 1 });
  expect(documents[1]).toMatchObject({ title: 'Pay rent 2', complete: false, description: source.description, tags: ['Home'], schedule: { date: '2026-10-31', timeZone: 'America/Recife' } });
  expect(documents[1].recurrence).toBeUndefined();
  expect(documents[1].addons).toEqual(['scheduling']);
  expect(source.recurrence.nextDate).toBe('2026-11-30');
  expect(await generateRecurringTasks(db, midnight)).toEqual({ created: 0 });
});
it('keeps repeating a completed source and reuses its name when no unfinished copy remains', async () => {
  const { db, documents } = database({ complete: true });
  await generateRecurringTasks(db, midnight);
  expect(documents[1].title).toBe('Pay rent');
  await generateRecurringTasks(db, new Date('2026-11-30T03:00:00Z'));
  expect(documents[2].title).toBe('Pay rent 2');
});
it('catches up missed months and clamps each occurrence to the end of its month', async () => {
  const { db, source, documents } = database({ nextDate: '2028-01-31' });
  expect(await generateRecurringTasks(db, new Date('2028-03-31T03:00:00Z'))).toEqual({ created: 3 });
  expect(documents.slice(1).map((doc) => doc.schedule.date)).toEqual(['2028-01-31', '2028-02-29', '2028-03-31']);
  expect(documents.slice(1).map((doc) => doc.title)).toEqual(['Pay rent 2', 'Pay rent 3', 'Pay rent 4']);
  expect(source.recurrence.nextDate).toBe('2028-04-30');
});
it('does not duplicate an occurrence after a crash or overlapping runs', async () => {
  const fixture = database(); fixture.failNextAdvance();
  await expect(generateRecurringTasks(fixture.db, midnight)).rejects.toThrow('Temporary failure');
  await Promise.all([generateRecurringTasks(fixture.db, midnight), generateRecurringTasks(fixture.db, midnight)]);
  expect(fixture.documents).toHaveLength(2);
});
it('skips archived lists and deleted or archived sources', async () => {
  const archived = database({ listArchived: true });
  expect(await generateRecurringTasks(archived.db, midnight)).toEqual({ created: 0 });
  for (const field of ['deleted', 'archived']) {
    const fixture = database(); (fixture.source as any)[field] = true;
    expect(await generateRecurringTasks(fixture.db, midnight)).toEqual({ created: 0 });
  }
});
