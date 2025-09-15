/**
 * * @jest-environment jsdom
 * */
/* eslint-disable object-shorthand */
import { ObjectId } from 'mongodb';

import {
  add,
  getListTasks,
  getSubTasks,
  remove,
  update,
} from '../tasks.action';

jest.mock('mongodb', () => {
  return {
    // eslint-disable-next-line func-names
    ObjectId: function (id?: string) {
      return {
        _fake: 'ObjectId',
        id: id ?? '000000000000000000000000',
        toString() {
          return String(this.id);
        },
      };
    },
  };
});
jest.mock('../auth.action', () => ({
  getSession: jest.fn(),
}));
jest.mock('../../lib/mongodb', () => ({
  getMongoDb: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('../../lib/functions', () => ({
  json: (val: any) => val,
}));

const { getSession } = require('../auth.action');
const { getMongoDb } = require('../../lib/mongodb');
const { logger } = require('../../lib/logger');
const { revalidatePath } = require('next/cache');

describe('tasks.action', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getSession.mockResolvedValue({ _id: new ObjectId() });

    // Fake collections
    mockDb = {
      collection: jest.fn().mockImplementation((_) => {
        return {
          aggregate: jest.fn().mockReturnValue({
            next: jest.fn().mockResolvedValue({ _id: 'list1', tasks: [] }),
            toArray: jest.fn().mockResolvedValue([{ _id: 'subtask1' }]),
          }),
          insertOne: jest
            .fn()
            .mockResolvedValue({ insertedId: new ObjectId() }),
          deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 }),
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
          updateOne: jest.fn().mockResolvedValue({
            matchedCount: 1,
            modifiedCount: 1,
          }),
        };
      }),
    };
    getMongoDb.mockResolvedValue(mockDb);
  });

  describe('getListTasks', () => {
    it('throws if not authenticated', async () => {
      getSession.mockResolvedValueOnce(null);
      await expect(getListTasks('123')).rejects.toThrow('Unauthorized');
    });

    it('returns tasks for list', async () => {
      const result = await getListTasks('123');
      expect(result).toEqual({ _id: 'list1', tasks: [] });
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('getSubTasks', () => {
    it('throws if not authenticated', async () => {
      getSession.mockResolvedValueOnce(null);
      await expect(getSubTasks('123')).rejects.toThrow('Unauthorized');
    });

    it('returns subtasks for a task', async () => {
      const result = await getSubTasks('123');
      expect(result).toEqual([{ _id: 'subtask1' }]);
    });
  });

  describe('add', () => {
    it('inserts a new task and returns it', async () => {
      const task = { title: 'Test task', listId: new ObjectId().toString() };
      const result = await add(task as any);
      expect(result).toHaveProperty('_id');
      expect(revalidatePath).toHaveBeenCalledWith('/tasks');
      expect(logger.info).toHaveBeenCalled();
    });

    it('logs and throws on error', async () => {
      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockRejectedValue(new Error('Insert failed')),
      });
      getMongoDb.mockResolvedValue(mockDb);

      await expect(add({ title: 'Bad', listId: '123' } as any)).rejects.toThrow(
        'Insert failed',
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes task and its subtasks', async () => {
      const result = await remove('123');
      expect(result.deletedCount).toBe(1);
      expect(revalidatePath).toHaveBeenCalledWith('/tasks');
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a task successfully', async () => {
      const task = { title: 'Updated', listId: new ObjectId().toString() };
      const result = await update('123', task as any);
      expect(result.modifiedCount).toBe(1);
      expect(revalidatePath).toHaveBeenCalledWith('/tasks');
    });

    it('logs and throws on error', async () => {
      mockDb.collection = jest.fn().mockReturnValue({
        updateOne: jest.fn().mockRejectedValue(new Error('Update failed')),
      });
      getMongoDb.mockResolvedValue(mockDb);

      await expect(
        update('123', { title: 'bad', listId: '123' } as any),
      ).rejects.toThrow('Update failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
