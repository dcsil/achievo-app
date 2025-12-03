import React, { createContext, useContext, useState, useCallback } from 'react';
import { getApiBaseUrl } from '../../config/api';

interface BlindBoxFigure {
  figure_id: string;
  series_id: string;
  name: string;
  rarity?: 'common' | 'rare' | 'secret'; 
  weight?: number;
  image?: string; // image url
}

interface BlindBoxFiguresContextType {
  figures: BlindBoxFigure[];
  loading: boolean;
  error: string | null;
  fetchAllFigures: () => Promise<void>;
  fetchFiguresBySeries: (seriesId: string) => Promise<void>;
  fetchFigureById: (figureId: string) => Promise<BlindBoxFigure | null>;
}

const BlindBoxFiguresContext = createContext<BlindBoxFiguresContextType | undefined>(undefined);

export const BlindBoxFiguresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [figures, setFigures] = useState<BlindBoxFigure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllFigures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/db/blind-box-figures`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch figures');
      }

      const data = await response.json();
      setFigures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFiguresBySeries = useCallback(async (seriesId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/db/blind-box-figures?series_id=${seriesId}`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch figures');
      }

      const data = await response.json();
      setFigures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFigureById = useCallback(async (figureId: string): Promise<BlindBoxFigure | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/db/blind-box-figures?figure_id=${figureId}`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch figure');
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
    <BlindBoxFiguresContext.Provider value={{ 
      figures, 
      loading, 
      error, 
      fetchAllFigures,
      fetchFiguresBySeries,
      fetchFigureById
    }}>
      {children}
    </BlindBoxFiguresContext.Provider>
  );
};

export const useBlindBoxFigures = () => {
  const context = useContext(BlindBoxFiguresContext);
  if (!context) {
    throw new Error('useBlindBoxFigures must be used within BlindBoxFiguresProvider');
  }
  return context;
};