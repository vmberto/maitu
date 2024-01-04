import type React, { type FormEvent } from 'react';

export type InputChangeEventHandler = React.ChangeEvent<
  HTMLInputElement<unknown>
>;
export type TextareaChangeEventHandler = React.ChangeEvent<
  HTMLTextAreaElement<unknown>
>;
export type SelectChangeEventHandler = React.ChangeEvent<
  HTMLSelectElement<unknown>
>;
export type ButtonEventHandler = React.MouseEvent<HTMLButtonElement<unknown>>;

export type GenericEvent =
  | InputChangeEventHandler
  | TextareaChangeEventHandler
  | SelectChangeEventHandler
  | ButtonEventHandler
  | FormEvent<HTMLInputElement>;
