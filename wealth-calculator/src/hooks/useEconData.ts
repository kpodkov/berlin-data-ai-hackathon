import { useState, useEffect } from 'react';
import type { EconData } from '../types';
import { loadAllData } from '../data/loader';

interface UseEconDataResult {
  data: EconData | null;
  loading: boolean;
  error: string | null;
}

export function useEconData(): UseEconDataResult {
  const [data, setData] = useState<EconData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadAllData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load economic data';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
