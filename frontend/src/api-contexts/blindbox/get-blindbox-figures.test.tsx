import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { BlindBoxFiguresProvider, useBlindBoxFigures } from './get-blindbox-figures';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('BlindBoxFiguresProvider', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BlindBoxFiguresProvider>{children}</BlindBoxFiguresProvider>
  );

  describe('useBlindBoxFigures hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useBlindBoxFigures());
      }).toThrow('useBlindBoxFigures must be used within BlindBoxFiguresProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      expect(result.current.figures).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.fetchAllFigures).toBe('function');
      expect(typeof result.current.fetchFiguresBySeries).toBe('function');
      expect(typeof result.current.fetchFigureById).toBe('function');
    });
  });

  describe('fetchAllFigures', () => {
    it('should fetch all figures successfully', async () => {
      const mockFigures = [
        { figure_id: '1', series_id: 's1', name: 'Figure 1', rarity: 'common' as const },
        { figure_id: '2', series_id: 's1', name: 'Figure 2', rarity: 'rare' as const }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFigures,
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await result.current.fetchAllFigures();

      await waitFor(() => {
        expect(result.current.figures).toEqual(mockFigures);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/blind-box-figures');
    });

    it('should set loading state during fetch', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => [],
        } as Response), 100))
      );

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      const fetchPromise = result.current.fetchAllFigures();
      
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await fetchPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch error with error message', async () => {
      const errorMessage = 'Database connection failed';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await expect(result.current.fetchAllFigures()).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await expect(result.current.fetchAllFigures()).rejects.toThrow('Failed to fetch figures');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await expect(result.current.fetchAllFigures()).rejects.toThrow('Network error');

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('fetchFiguresBySeries', () => {
    it('should fetch figures by series ID successfully', async () => {
      const seriesId = 'series-123';
      const mockFigures = [
        { figure_id: '1', series_id: seriesId, name: 'Figure 1', rarity: 'common' as const }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFigures,
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await result.current.fetchFiguresBySeries(seriesId);

      await waitFor(() => {
        expect(result.current.figures).toEqual(mockFigures);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `http://127.0.0.1:5000/db/blind-box-figures?series_id=${seriesId}`
      );
    });

    it('should handle fetch error for series', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Series not found' }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await expect(result.current.fetchFiguresBySeries('invalid')).rejects.toThrow('Series not found');
    });

    it('should handle empty series result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await result.current.fetchFiguresBySeries('empty-series');

      await waitFor(() => {
        expect(result.current.figures).toEqual([]);
      });
    });
  });

  describe('fetchFigureById', () => {
    it('should fetch figure by ID successfully', async () => {
      const mockFigure = { 
        figure_id: '1', 
        series_id: 's1', 
        name: 'Secret Figure', 
        rarity: 'secret' as const,
        weight: 1,
        image: 'https://example.com/image.jpg'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFigure,
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      const figure = await result.current.fetchFigureById('1');

      expect(figure).toEqual(mockFigure);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/blind-box-figures?figure_id=1'
      );
    });

    it('should return null on fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Figure not found' }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      const figure = await result.current.fetchFigureById('invalid');

      expect(figure).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Figure not found');
      });
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      const figure = await result.current.fetchFigureById('1');

      expect(figure).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should handle different rarity types', async () => {
      const rarities = ['common', 'rare', 'secret'] as const;

      for (const rarity of rarities) {
        const mockFigure = { 
          figure_id: `${rarity}-1`, 
          series_id: 's1', 
          name: `${rarity} Figure`, 
          rarity 
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockFigure,
        } as Response);

        const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

        const figure = await result.current.fetchFigureById(`${rarity}-1`);

        expect(figure?.rarity).toBe(rarity);
      }
    });
  });

  describe('error handling', () => {
    it('should handle non-Error thrown objects', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await expect(result.current.fetchAllFigures()).rejects.toBe('String error');

      await waitFor(() => {
        expect(result.current.error).toBe('An error occurred');
      });
    });

    it('should clear previous errors on new fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await expect(result.current.fetchAllFigures()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await result.current.fetchAllFigures();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('state management', () => {
    it('should maintain figures state across multiple fetches', async () => {
      const firstBatch = [
        { figure_id: '1', series_id: 's1', name: 'Figure 1', rarity: 'common' as const }
      ];
      const secondBatch = [
        { figure_id: '2', series_id: 's2', name: 'Figure 2', rarity: 'rare' as const }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstBatch,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => secondBatch,
        } as Response);

      const { result } = renderHook(() => useBlindBoxFigures(), { wrapper });

      await result.current.fetchAllFigures();
      await waitFor(() => {
        expect(result.current.figures).toEqual(firstBatch);
      });

      await result.current.fetchFiguresBySeries('s2');
      await waitFor(() => {
        expect(result.current.figures).toEqual(secondBatch);
      });
    });
  });
});