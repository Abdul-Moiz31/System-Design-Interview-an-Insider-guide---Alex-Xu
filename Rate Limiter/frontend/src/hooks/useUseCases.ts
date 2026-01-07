import { useState, useEffect } from 'react';
import { UseCase } from '../types/use-cases';
import { API_BASE } from '../constants/algorithms';

export function useUseCases() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUseCases = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/use-cases`);
        if (res.ok) {
          const data = await res.json();
          setUseCases(data.useCases);
        }
      } catch (error) {
        console.error('Failed to fetch use cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUseCases();
  }, []);

  return { useCases, loading };
}

