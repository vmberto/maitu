/**
 * * @jest-environment jsdom
 * */
/* eslint-disable object-shorthand */
import { revalidatePath } from 'next/cache';

import { logger } from '../../lib/logger';
import { getMongoDb } from '../../lib/mongodb';
import { getSession } from '../auth.action';
import * as actions from '../lists.action';

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
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('../auth.action', () => ({
  getSession: jest.fn(),
}));
jest.mock('../../lib/mongodb', () => ({
  getMongoDb: jest.fn(),
}));
jest.mock('../../lib/functions', () => ({
  json: (x: any) => x,
}));
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const VALID_OID_USER = '507f191e810c19729de860ea';
const VALID_OID_LIST = '64b2f7a9c1e6f9a1b2c3d4e5';

describe('lists.actions', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // default session
    (getSession as jest.Mock).mockResolvedValue({ _id: VALID_OID_USER });

    // default mongo
    (getMongoDb as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('get', () => {
    it('returns lists and logs success', async () => {
      const lists = [{ _id: VALID_OID_LIST, name: 'A', index: 0 }];
      const toArray = jest.fn().mockResolvedValue(lists);
      const find = jest.fn().mockReturnValue({ toArray });
      mockDb.collection.mockReturnValue({ find });

      const result = await actions.get();

      expect(mockDb.collection).toHaveBeenCalledWith('lists');
      expect(find).toHaveBeenCalled();
      expect(result).toEqual(lists);
      expect(logger.info).toHaveBeenCalledWith(
        { userId: VALID_OID_USER, count: 1 },
        'Fetched lists successfully',
      );
    });

    it('logs error and rethrows on failure', async () => {
      const toArray = jest.fn().mockRejectedValue(new Error('db fail'));
      const find = jest.fn().mockReturnValue({ toArray });
      mockDb.collection.mockReturnValue({ find });

      await expect(actions.get()).rejects.toThrow('db fail');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          userId: VALID_OID_USER,
        }),
        'Failed to fetch lists',
      );
    });
  });

  describe('add', () => {
    it('throws Unauthorized if no user', async () => {
      (getSession as jest.Mock).mockResolvedValue(null);

      await expect(actions.add({ name: 'X', index: 0 } as any)).rejects.toThrow(
        'Unauthorized',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'Unauthorized attempt to add list',
      );
    });

    it('inserts list, revalidates, returns json and logs', async () => {
      const insertOne = jest
        .fn()
        .mockResolvedValue({ insertedId: VALID_OID_LIST });
      mockDb.collection.mockReturnValue({ insertOne });

      const payload = { name: 'Groceries', index: 1 } as any;
      const result = await actions.add(payload);

      expect(mockDb.collection).toHaveBeenCalledWith('lists');
      expect(insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Groceries',
          owner: expect.any(Object),
        }),
      );
      expect(result).toEqual({ ...payload, _id: VALID_OID_LIST });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(logger.info).toHaveBeenCalledWith(
        { userId: VALID_OID_USER, listId: VALID_OID_LIST },
        'List added successfully',
      );
    });

    it('logs error and rethrows on failure', async () => {
      const insertOne = jest.fn().mockRejectedValue(new Error('insert fail'));
      mockDb.collection.mockReturnValue({ insertOne });

      await expect(actions.add({ name: 'X', index: 0 } as any)).rejects.toThrow(
        'insert fail',
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          userId: VALID_OID_USER,
          list: expect.any(Object),
        }),
        'Failed to add list',
      );
    });
  });

  describe('update', () => {
    it('updates list, revalidates, returns result and logs', async () => {
      const updateOne = jest
        .fn()
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      mockDb.collection.mockReturnValue({ updateOne });

      const result = await actions.update(VALID_OID_LIST, { title: 'New' });

      expect(mockDb.collection).toHaveBeenCalledWith('lists');
      expect(updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Object) }, // ObjectId from VALID_OID_LIST
        { $set: { title: 'New' } },
      );
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(result).toEqual({ matchedCount: 1, modifiedCount: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        { listId: VALID_OID_LIST, matched: 1, modified: 1 },
        'List updated successfully',
      );
    });

    it('logs error and rethrows on failure', async () => {
      const updateOne = jest.fn().mockRejectedValue(new Error('update fail'));
      mockDb.collection.mockReturnValue({ updateOne });

      await expect(
        actions.update(VALID_OID_LIST, { title: 'X' }),
      ).rejects.toThrow('update fail');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          listId: VALID_OID_LIST,
          updatedData: { title: 'X' },
        }),
        'Failed to update list',
      );
    });
  });

  describe('remove', () => {
    it('deletes todos, deletes list, revalidates and logs', async () => {
      const deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });
      const deleteOne = jest
        .fn()
        .mockResolvedValue({ acknowledged: true, deletedCount: 1 });

      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'todos') return { deleteMany };
        if (name === 'lists') return { deleteOne };
        return {};
      });

      const result = await actions.remove(VALID_OID_LIST);

      expect(deleteMany).toHaveBeenCalledWith({ listId: expect.any(Object) });
      expect(deleteOne).toHaveBeenCalledWith({ _id: expect.any(Object) });
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(logger.info).toHaveBeenCalledWith(
        { listId: VALID_OID_LIST, deleted: 1 },
        'List removed successfully',
      );
    });

    it('logs error and rethrows on failure', async () => {
      const deleteMany = jest.fn().mockRejectedValue(new Error('delete fail'));
      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'todos') return { deleteMany };
        return {};
      });

      await expect(actions.remove(VALID_OID_LIST)).rejects.toThrow(
        'delete fail',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          listId: VALID_OID_LIST,
        }),
        'Failed to remove list',
      );
    });
  });
});
