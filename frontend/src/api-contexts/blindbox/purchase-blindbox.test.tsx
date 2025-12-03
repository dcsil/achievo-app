import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { BlindBoxPurchaseProvider, useBlindBoxPurchase } from './purchase-blindbox';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('BlindBoxPurchaseProvider', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BlindBoxPurchaseProvider>{children}</BlindBoxPurchaseProvider>
  );

  describe('useBlindBoxPurchase hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useBlindBoxPurchase());
      }).toThrow('useBlindBoxPurchase must be used within BlindBoxPurchaseProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      expect(result.current.userFigures).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.purchaseBlindBox).toBe('function');
      expect(typeof result.current.getUserFigures).toBe('function');
    });
  });

  describe('purchaseBlindBox', () => {
    const mockPurchaseResult = {
      status: 'success',
      purchase_id: 'purchase-123',
      series_id: 'series-456',
      series_name: 'Series 1',
      cost_points: 100,
      awarded_figure: {
        figure_id: 'fig-789',
        name: 'Cool Figure',
        rarity: 'rare' as const,
        image: 'https://example.com/figure.jpg'
      },
      remaining_points: 900
    };

    const mockUserFigures = {
      results: [
        {
          purchase_id: 'purchase-123',
          user_id: 'user-1',
          series_id: 'series-456',
          series_name: 'Series 1',
          purchased_at: '2024-01-01T00:00:00Z',
          awarded_figure_id: 'fig-789',
          figure_name: 'Cool Figure',
          rarity: 'rare' as const
        }
      ]
    };

    it('should purchase blind box successfully without series ID', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPurchaseResult,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserFigures,
        } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      const purchaseResult = await result.current.purchaseBlindBox('user-1');

      expect(purchaseResult).toEqual(mockPurchaseResult);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://127.0.0.1:5000/db/blind-boxes/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'user-1' })
      });

      expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:5000/db/users/user-1/figures');
    });

    it('should purchase blind box successfully with series ID', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPurchaseResult,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserFigures,
        } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      const purchaseResult = await result.current.purchaseBlindBox('user-1', 'series-456');

      expect(purchaseResult).toEqual(mockPurchaseResult);

      expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://127.0.0.1:5000/db/blind-boxes/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'user-1', series_id: 'series-456' })
      });
    });

    it('should set loading state during purchase', async () => {
      mockFetch
        .mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => mockPurchaseResult,
          } as Response), 100))
        );

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      const purchasePromise = result.current.purchaseBlindBox('user-1');

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await purchasePromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle purchase error with error message', async () => {
      const errorMessage = 'Insufficient points';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.purchaseBlindBox('user-1')).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle purchase error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.purchaseBlindBox('user-1')).rejects.toThrow('Failed to purchase blind box');
    });

    it('should handle network error during purchase', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.purchaseBlindBox('user-1')).rejects.toThrow('Network error');

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should refresh user figures after successful purchase', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPurchaseResult,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserFigures,
        } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await result.current.purchaseBlindBox('user-1');

      await waitFor(() => {
        expect(result.current.userFigures).toEqual(mockUserFigures.results);
      });
    });

    it('should handle different rarity types in awarded figure', async () => {
      const rarities = ['common', 'rare', 'secret'] as const;

      for (const rarity of rarities) {
        const result = {
          ...mockPurchaseResult,
          awarded_figure: {
            ...mockPurchaseResult.awarded_figure,
            rarity
          }
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => result,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] }),
          } as Response);

        const { result: hookResult } = renderHook(() => useBlindBoxPurchase(), { wrapper });

        const purchaseResult = await hookResult.current.purchaseBlindBox('user-1');

        expect(purchaseResult.awarded_figure.rarity).toBe(rarity);
      }
    });
  });

  describe('getUserFigures', () => {
    it('should fetch user figures successfully with paginated response', async () => {
      const mockResponse = {
        results: [
          {
            purchase_id: 'p1',
            user_id: 'user-1',
            series_id: 's1',
            series_name: 'Series 1',
            purchased_at: '2024-01-01T00:00:00Z',
            awarded_figure_id: 'fig-1',
            figure_name: 'Figure 1',
            rarity: 'common' as const
          },
          {
            purchase_id: 'p2',
            user_id: 'user-1',
            series_id: 's2',
            series_name: 'Series 2',
            purchased_at: '2024-01-02T00:00:00Z',
            opened_at: '2024-01-03T00:00:00Z',
            awarded_figure_id: 'fig-2',
            figure_name: 'Figure 2',
            rarity: 'rare' as const,
            image: 'https://example.com/fig2.jpg'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await result.current.getUserFigures('user-1');

      await waitFor(() => {
        expect(result.current.userFigures).toEqual(mockResponse.results);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/users/user-1/figures');
    });

    it('should handle direct array response (fallback)', async () => {
      const mockResponse = [
        {
          purchase_id: 'p1',
          user_id: 'user-1',
          series_id: 's1',
          purchased_at: '2024-01-01T00:00:00Z',
          awarded_figure_id: 'fig-1'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await result.current.getUserFigures('user-1');

      await waitFor(() => {
        expect(result.current.userFigures).toEqual(mockResponse);
      });
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await result.current.getUserFigures('user-1');

      await waitFor(() => {
        expect(result.current.userFigures).toEqual([]);
      });
    });

    it('should handle unexpected response format', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'format' }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await result.current.getUserFigures('user-1');

      await waitFor(() => {
        expect(result.current.userFigures).toEqual([]);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Unexpected response format:', { unexpected: 'format' });
      
      consoleSpy.mockRestore();
    });

    it('should set loading state during fetch', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ results: [] }),
        } as Response), 100))
      );

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      const fetchPromise = result.current.getUserFigures('user-1');

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await fetchPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch error with error message', async () => {
      const errorMessage = 'User not found';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.getUserFigures('invalid-user')).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.userFigures).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.getUserFigures('user-1')).rejects.toThrow('Failed to fetch user figures');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.getUserFigures('user-1')).rejects.toThrow('Network error');

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.userFigures).toEqual([]);
      });
    });

    it('should set empty array on error', async () => {
        const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [{ purchase_id: 'p1', user_id: 'user-1', series_id: 's1', purchased_at: '2024-01-01', awarded_figure_id: 'f1' }] }),
        } as Response);

        await result.current.getUserFigures('user-1');

        await waitFor(() => {
            expect(result.current.userFigures.length).toBe(1);
        });

        mockFetch.mockRejectedValueOnce(new Error('Some error'));

        await expect(result.current.getUserFigures('user-1')).rejects.toThrow();

        await waitFor(() => {
            expect(result.current.userFigures).toEqual([]);
        });
    });
  });

  describe('error handling', () => {
    it('should handle non-Error thrown objects', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.getUserFigures('user-1')).rejects.toBe('String error');

      await waitFor(() => {
        expect(result.current.error).toBe('An error occurred');
      });
    });

    it('should clear previous errors on new fetch', async () => {

        mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.getUserFigures('user-1')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await result.current.getUserFigures('user-1');

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should clear previous errors on purchase attempt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Purchase failed' }),
      } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await expect(result.current.purchaseBlindBox('user-1')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('Purchase failed');
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            purchase_id: 'p1',
            series_id: 's1',
            series_name: 'Series',
            cost_points: 100,
            awarded_figure: { figure_id: 'f1', name: 'Figure' },
            remaining_points: 900
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        } as Response);

      await result.current.purchaseBlindBox('user-1');

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('state management', () => {
    it('should maintain userFigures state across multiple fetches', async () => {
      const firstBatch = {
        results: [
          { purchase_id: 'p1', user_id: 'user-1', series_id: 's1', purchased_at: '2024-01-01', awarded_figure_id: 'f1' }
        ]
      };
      const secondBatch = {
        results: [
          { purchase_id: 'p2', user_id: 'user-1', series_id: 's2', purchased_at: '2024-01-02', awarded_figure_id: 'f2' }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstBatch,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => secondBatch,
        } as Response);

      const { result } = renderHook(() => useBlindBoxPurchase(), { wrapper });

      await result.current.getUserFigures('user-1');
      
      await waitFor(() => {
        expect(result.current.userFigures).toEqual(firstBatch.results);
      });

      await result.current.getUserFigures('user-1');
      
      await waitFor(() => {
        expect(result.current.userFigures).toEqual(secondBatch.results);
      });
    });
  });
});