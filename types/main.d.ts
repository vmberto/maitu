import { type Colors } from 'src/ui/common/ColorPicker';

export interface TodoList {
  id: string;
  title: string;
  color: Colors;

  index: number;

  createdAt: Date;
}

export interface Todo {
  id: string;
  title: string;

  listId: string;

  description: string;

  complete: boolean;
  completeDisabled: boolean;

  location?: string;

  index: number;

  createdAt: Date;
  completedAt: Date;
}
