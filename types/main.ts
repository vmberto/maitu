import type { ObjectId } from 'mongodb';

import type { Colors } from '@/src/components/ColorPicker/ColorPicker';

export enum ListType {
  tasks = 'tasks',
  timeline = 'timeline',
}

export interface UserObject {
  _id?: ObjectId | string;
  username: string;
  email: string;
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
  archived?: boolean;
}

export interface TaskLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: 'openstreetmap' | 'manual';
  placeId: string;
}

export interface Task {
  _id?: ObjectId | string;
  title: string;

  listId: ObjectId | string;
  parentTaskId?: ObjectId | string | null;

  description: string;

  complete: boolean;

  // Keep legacy text locations readable; new selections include coordinates.
  location?: TaskLocation | string | null;
  addons?: 'location'[];

  index?: number;

  createdAt: string;
  completedAt?: string | null;

  tags?: string[];
}

export type TasksResponse = List & { tasks: Task[] };
