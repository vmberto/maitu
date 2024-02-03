// useTimeout.ts
import { useState } from 'react';

interface TimeoutObject {
  id: string;
  timeout: NodeJS.Timeout;
}

export const useExecutionTimeout = (delay: number = 2000) => {
  const [timeouts, setTimeouts] = useState<TimeoutObject[]>([]);

  const clearTimeoutById = (id: string) => {
    setTimeouts((prevTimeouts) => {
      const timeoutObj = prevTimeouts.find((timeout) => timeout.id === id);
      if (timeoutObj) {
        clearTimeout(timeoutObj.timeout);
        return prevTimeouts.filter((timeout) => timeout.id !== id);
      }
      return prevTimeouts;
    });
  };

  const setExecutionTimeout = (id: string, callback: () => void) => {
    const timeout = setTimeout(() => {
      callback();
      clearTimeoutById(id);
    }, delay);

    setTimeouts((prevTimeouts) => [...prevTimeouts, { id, timeout }]);
  };

  return { setExecutionTimeout, clearTimeoutById };
};
