import { useEffect, useReducer } from 'react';
import { narrator } from './speech';

export function useNarrator() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const unsub = narrator.subscribe(force);
    return () => {
      unsub();
    };
  }, []);
  return narrator;
}
