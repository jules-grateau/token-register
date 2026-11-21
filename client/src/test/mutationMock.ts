import { useState } from 'react';

type Trigger = (arg: never) => { unwrap: () => Promise<unknown> };

/**
 * Stand-in for an RTK Query mutation hook: `[trigger, { isLoading }]`, `isLoading` true from the
 * call until the request settles. `trigger` is a jest.fn returning `{ unwrap }`.
 */
export function useMockMutation(trigger: Trigger) {
  const [isLoading, setIsLoading] = useState(false);
  const run = (arg: never) => {
    setIsLoading(true);
    const result = trigger(arg);
    return { unwrap: () => result.unwrap().finally(() => setIsLoading(false)) };
  };
  return [run, { isLoading }] as const;
}
