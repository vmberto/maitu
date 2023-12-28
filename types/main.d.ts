import {Colors} from 'src/ui/common/ColorPicker';

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

    description: string;

    complete: boolean;
    completeDisabled: boolean;

    location?: string;

    createdAt: Date;
    completedAt: Date;
}
