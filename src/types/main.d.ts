export interface TodoList {
  _id: string;
  title: string;

  dateAdded: Date;
}

export interface Todo {
  _id: string;
  title: string;

  listId: string;

  complete: boolean;
}

export interface Todo {
  _id: string;
  title: string;

  listId: string;
}
