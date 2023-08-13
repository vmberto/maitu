import { Colors } from 'src/components/ColorPicker';

export interface TodoList {
  id: string;
  title: string;
  color: Colors;

  dateAdded: Date;
}

export interface Todo {
  id: string;
  title: string;

  listId: string;

  complete: boolean;
  completeDisabled: boolean;
}
