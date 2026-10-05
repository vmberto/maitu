'use client';

import { CompleteTasks } from './CompleteTasks';
import { Tasks } from './Tasks';
export const TasksWrapper = () => (
  <section className="mx-auto h-full max-w-xl">
    <Tasks />
    <CompleteTasks />
  </section>
);
