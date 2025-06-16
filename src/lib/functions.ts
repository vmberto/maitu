import { type GenericEvent } from '../../types/events';

export const formatDate = (dateString?: string, onlyDate = false) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (onlyDate) {
    return `${day.toString().padStart(2, '0')}/${month
      .toString()
      .padStart(2, '0')}/${year}`;
  }

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

export const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
