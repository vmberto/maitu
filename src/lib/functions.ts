import { type GenericEvent } from '../../types/events';

export const formatDate = (dateString?: string) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${day.toString().padStart(2, '0')}/${month
    .toString()
    .padStart(2, '0')}/${year} ${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};

export const stopPropagationFn = (e: GenericEvent) => {
  e.stopPropagation();
};

export const json = (data: unknown) => JSON.parse(JSON.stringify(data));
