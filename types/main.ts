import type { ObjectId } from 'mongodb';

import type { Colors } from '@/src/components/ColorPicker';

export interface UserObject {
  _id: ObjectId | undefined;
  username: string;
  email: string;
  password: string;
}

export interface TodoList {
  _id: string | any;
  id: string;
  title: string;
  color: Colors;

  index: number;

  createdAt: Date;
}

export interface Todo {
  _id: ObjectId | undefined;
  title: string;

  listId: ObjectId;

  description: string;

  complete: boolean;
  completeDisabled: boolean;

  location?: string;

  index: number;

  createdAt: string;
  completedAt: string;
}

export type TodosResponse = TodoList & { todos: Todo[] };
