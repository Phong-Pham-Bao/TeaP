'use client';

import { useCallback, useEffect, useState } from 'react';

export function useUrlEnumState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[],
) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const readUrl = () => {
      const url = new URL(window.location.href);
      const candidate = url.searchParams.get(key) as T | null;
      if (candidate && allowedValues.includes(candidate)) {
        setValue(candidate);
        return;
      }

      setValue(defaultValue);
      if (candidate) {
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
      }
    };

    readUrl();
    window.addEventListener('popstate', readUrl);
    return () => window.removeEventListener('popstate', readUrl);
  }, [allowedValues, defaultValue, key]);

  const updateValue = useCallback((nextValue: T) => {
    setValue(nextValue);
    const url = new URL(window.location.href);
    if (nextValue === defaultValue) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, nextValue);
    }
    window.history.pushState({}, '', url);
  }, [defaultValue, key]);

  return [value, updateValue] as const;
}
