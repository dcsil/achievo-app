import React, { createContext, useContext, useState, useCallback } from 'react';

interface BlindBoxSeries {
  series_id: string;
  name: string;
  description?: string;
  cost_points: number;
  release_date?: string;
  image?: string; // Supabase image URL
}

interface BlindBoxSeriesContextType {
  series: BlindBoxSeries[];
  loading: boolean;
  error: string | null;
  fetchAllSeries: () => Promise<void>;
  fetchSeriesById: (seriesId: string) => Promise<BlindBoxSeries | null>;
}

const BlindBoxSeriesContext = createContext<BlindBoxSeriesContextType | undefined>(undefined);

export const BlindBoxSeriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [series, setSeries] = useState<BlindBoxSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://127.0.0.1:5000';

  const fetchAllSeries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/db/blind-box-series`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch series');
      }

      const data = await response.json();
      setSeries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeriesById = useCallback(async (seriesId: string): Promise<BlindBoxSeries | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/db/blind-box-series?series_id=${seriesId}`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch series');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <BlindBoxSeriesContext.Provider value={{ 
      series, 
      loading, 
      error, 
      fetchAllSeries,
      fetchSeriesById
    }}>
      {children}
    </BlindBoxSeriesContext.Provider>
  );
};

export const useBlindBoxSeries = () => {
  const context = useContext(BlindBoxSeriesContext);
  if (!context) {
    throw new Error('useBlindBoxSeries must be used within BlindBoxSeriesProvider');
  }
  return context;
};
