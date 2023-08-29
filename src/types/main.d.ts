import { Colors } from 'src/ui/common/ColorPicker';

export interface TodoList {
  id: string;
  title: string;
  color: Colors;

  createdAt: Date;
}

export interface Todo {
  id: string;
  title: string;

  listId: string;

  complete: boolean;
  completeDisabled: boolean;

  createdAt: Date;
}
