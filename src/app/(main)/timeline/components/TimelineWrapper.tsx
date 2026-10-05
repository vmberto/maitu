'use client';

import { NewTextInput } from './NewTextInput';
import { Texts } from './Texts';
export const TimelineWrapper = () => (
  <section className="mx-auto h-full max-w-xl">
    <div className="px-5 pb-5">
      <NewTextInput />
      <Texts />
    </div>
  </section>
);
