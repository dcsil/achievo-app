import React from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { BlindBoxSeriesProvider, useBlindBoxSeries } from './get-blindbox-series';

const mockSeriesData = [
  {
    series_id: '1',
    name: 'Series One',
    description: 'First series',
    cost_points: 100,
    release_date: '2024-01-01',
    image: 'https://example.com/image1.jpg'
  },
  {
    series_id: '2',
    name: 'Series Two',
    cost_points: 200
  }
];

const mockSingleSeries = {
  series_id: '1',
  name: 'Series One',
  description: 'First series',
  cost_points: 100,
  release_date: '2024-01-01',
  image: 'https://example.com/image1.jpg'
};

describe('BlindBoxSeriesProvider', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('useBlindBoxSeries hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useBlindBoxSeries());
      }).toThrow('useBlindBoxSeries must be used within BlindBoxSeriesProvider');
      
      consoleSpy.mockRestore();
    });

    it('should return context when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      expect(result.current).toHaveProperty('series');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('fetchAllSeries');
      expect(result.current).toHaveProperty('fetchSeriesById');
    });
  });

  describe('fetchAllSeries', () => {
    it('should fetch all series successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeriesData
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      expect(result.current.loading).toBe(false);
      expect(result.current.series).toEqual([]);

      await act(async () => {
        await result.current.fetchAllSeries();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.series).toEqual(mockSeriesData);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/blind-box-series');
    });

    it('should set loading to true while fetching', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => mockSeriesData
        }), 100))
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      act(() => {
        result.current.fetchAllSeries();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
    });

    it('should handle fetch error with error message', async () => {
      const errorMessage = 'Network error';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage })
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchAllSeries();
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle fetch error without error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchAllSeries();
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch series');
      });
    });

    it('should handle network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchAllSeries();
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network failed');
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchAllSeries();
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('An error occurred');
      });
    });
  });

  describe('fetchSeriesById', () => {
    it('should fetch series by id successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSingleSeries
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      let series;
      await act(async () => {
        series = await result.current.fetchSeriesById('1');
      });

      expect(series).toEqual(mockSingleSeries);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/blind-box-series?series_id=1');
    });

    it('should handle fetch error and return null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' })
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      let series;
      await act(async () => {
        series = await result.current.fetchSeriesById('999');
      });

      expect(series).toBeNull();
      expect(result.current.error).toBe('Not found');
      expect(result.current.loading).toBe(false);
    });

    it('should handle network failure and return null', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      let series;
      await act(async () => {
        series = await result.current.fetchSeriesById('1');
      });

      expect(series).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Provider rendering', () => {
    it('should render children correctly', () => {
      render(
        <BlindBoxSeriesProvider>
          <div>Test Child</div>
        </BlindBoxSeriesProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide initial state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      expect(result.current.series).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('State management', () => {
    it('should clear error on new fetch', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'First error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSeriesData
        });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BlindBoxSeriesProvider>{children}</BlindBoxSeriesProvider>
      );

      const { result } = renderHook(() => useBlindBoxSeries(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchAllSeries();
        } catch (err) {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      await act(async () => {
        await result.current.fetchAllSeries();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.series).toEqual(mockSeriesData);
    });
  });
});