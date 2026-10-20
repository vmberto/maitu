import type { ObjectId } from 'mongodb';

import type { Colors } from './colors';

export enum ListType {
  tasks = 'tasks',
  places = 'places',
  timeline = 'timeline',
  notes = 'notes',
  mixed = 'mixed',
}

export interface UserObject {
  _id?: ObjectId | string;
  username: string;
  email: string;
}

export interface Folder {
  type?: never;
  _id: string;
  title: string;
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
  folderId?: string | null;
}

export interface TaskLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: 'openstreetmap' | 'manual';
  placeId: string;
}

export type TaskAddon = 'location' | 'relatedTasks' | 'scheduling';

export interface TaskSchedule {
  date: string;
  time?: string;
  timeZone: string;
}
export interface TaskReminder {
  id: string;
  at: string;
  timeZone: string;
}

export interface Task {
  type?: 'task' | 'note';
  archived?: boolean;
  _id?: ObjectId | string;
  title: string;

  listId: ObjectId | string;
  parentTaskId?: ObjectId | string | null;

  description: string;

  complete: boolean;
  schedule?: TaskSchedule | null;
  wasScheduled?: boolean;
  reminder?: TaskReminder | null;

  // Keep legacy text locations readable; new selections include coordinates.
  location?: TaskLocation | string | null;
  addons?: TaskAddon[];

  index?: number;

  createdAt: string;
  completedAt?: string | null;

  tags?: string[];
}
