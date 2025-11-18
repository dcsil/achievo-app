import React, { createContext, useContext, useState, useCallback } from 'react';

interface AwardedFigure {
  figure_id: string;
  name: string;
  rarity?: 'common' | 'rare' | 'secret';
  image?: string; // Include image in awarded figure
}

interface PurchaseResult {
  status: string;
  purchase_id: string;
  series_id: string;
  series_name: string;
  cost_points: number;
  awarded_figure: AwardedFigure;
  remaining_points: number;
}

interface UserFigure {
  purchase_id: string;
  user_id: string;
  series_id: string;
  series_name?: string;
  purchased_at: string;
  opened_at?: string;
  awarded_figure_id: string;
  figure_name?: string;
  rarity?: 'common' | 'rare' | 'secret';
  image?: string; // Include image in user figures
}

interface BlindBoxPurchaseContextType {
  userFigures: UserFigure[];
  loading: boolean;
  error: string | null;
  purchaseBlindBox: (userId: string, seriesId?: string) => Promise<PurchaseResult>;
  getUserFigures: (userId: string) => Promise<void>;
}

const BlindBoxPurchaseContext = createContext<BlindBoxPurchaseContextType | undefined>(undefined);

export const BlindBoxPurchaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userFigures, setUserFigures] = useState<UserFigure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:5000';

  const purchaseBlindBox = useCallback(async (userId: string, seriesId?: string): Promise<PurchaseResult> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/db/blind-boxes/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...(seriesId && { series_id: seriesId })
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to purchase blind box');
      }

      const result = await response.json();
      
      // Refresh user figures after purchase
      await getUserFigures(userId);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserFigures = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/db/users/${userId}/figures`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch user figures');
      }

      const data = await response.json();
      setUserFigures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <BlindBoxPurchaseContext.Provider value={{ 
      userFigures, 
      loading, 
      error, 
      purchaseBlindBox, 
      getUserFigures
    }}>
      {children}
    </BlindBoxPurchaseContext.Provider>
  );
};

export const useBlindBoxPurchase = () => {
  const context = useContext(BlindBoxPurchaseContext);
  if (!context) {
    throw new Error('useBlindBoxPurchase must be used within BlindBoxPurchaseProvider');
  }
  return context;
};