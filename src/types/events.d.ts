import React from 'react';

export type InputChangeEventHandler = React.ChangeEvent<HTMLInputElement<any>>;
export type TextareaChangeEventHandler = React.ChangeEvent<HTMLTextAreaElement<any>>;
export type SelectChangeEventHandler = React.ChangeEvent<HTMLSelectElement<any>>;
export type ButtonEventHandler = React.MouseEvent<HTMLButtonElement<any>>;

export type GenericEvent =
  | InputChangeEventHandler
  | TextareaChangeEventHandler
  | SelectChangeEventHandler
  | ButtonEventHandler;
