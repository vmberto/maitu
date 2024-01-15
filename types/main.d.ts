import type { ObjectId } from 'mongodb';
import { type Colors } from 'src/ui/common/ColorPicker';

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

  listId: string;

  description: string;

  complete: boolean;
  completeDisabled: boolean;

  location?: string;

  index: number;

  createdAt: string;
  completedAt: string;
}

type TodosResponse = TodoList & { todos: Todo[] };
