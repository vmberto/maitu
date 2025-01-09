import type { ObjectId } from 'mongodb';

import type { Colors } from '@/src/components/ColorPicker/ColorPicker';

export enum ListType {
  tasks = 'tasks',
  timeline = 'timeline',
}

export interface UserObject {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
}

export interface List {
  _id: string | any;
  id: string;
  title: string;
  color: Colors;
  emoji: string;

  index: number;

  createdAt: string;

  type: ListType;
}

export interface Task {
  _id?: ObjectId | string;
  title: string;

  listId: ObjectId | string;
  parentTaskId?: ObjectId | string;

  description: string;

  complete: boolean;

  location?: string;

  index?: number;

  createdAt: string;
  completedAt?: string;

  tags?: string[];
}

export type TasksResponse = List & { tasks: Task[] };
