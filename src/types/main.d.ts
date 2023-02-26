import { Colors } from '@/components/ColorPicker';

export interface TodoList {
  _id: string;
  title: string;
  color: Colors;

  dateAdded: Date;
}

export interface Todo {
  _id: string;
  title: string;

  listId: string;

  complete: boolean;
  completeDisabled: boolean;
}
