import { useState, useEffect } from 'react';

export const useFetch = (asyncFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await asyncFn();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: () => asyncFn() };
};

export default useFetch;
