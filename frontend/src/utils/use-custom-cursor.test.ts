import { renderHook, act } from '@testing-library/react';
import { useCustomCursor } from './use-custom-cursor';

describe('useCustomCursor', () => {
  const mockFigures = [
    { id: 'figure-1', image: 'https://example.com/cursor1.png' },
    { id: 'figure-2', image: 'https://example.com/cursor2.png' },
    { id: 'figure-3', image: '' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    const existingStyle = document.getElementById('global-custom-cursor');
    if (existingStyle) {
      existingStyle.remove();
    }
    document.body.style.cursor = '';
  });

  afterEach(() => {
    const style = document.getElementById('global-custom-cursor');
    if (style) {
      style.remove();
    }
  });

  describe('Initialization', () => {
    it('returns null equippedCursorId when nothing is stored', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      expect(result.current.equippedCursorId).toBeNull();
    });

    it('loads equipped cursor from localStorage on mount', () => {
      localStorage.setItem('equipped_cursor', 'figure-1');

      const { result } = renderHook(() => useCustomCursor(mockFigures));

      expect(result.current.equippedCursorId).toBe('figure-1');
    });

    it('returns equipCursor function', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      expect(typeof result.current.equipCursor).toBe('function');
    });

    it('returns unequipCursor function', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      expect(typeof result.current.unequipCursor).toBe('function');
    });
  });

  describe('equipCursor', () => {
    it('sets the equipped cursor id', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.equipCursor('figure-2');
      });

      expect(result.current.equippedCursorId).toBe('figure-2');
    });

    it('saves cursor to localStorage', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.equipCursor('figure-1');
      });

      expect(localStorage.getItem('equipped_cursor')).toBe('figure-1');
    });

    it('dispatches cursor-changed event', () => {
      const eventListener = jest.fn();
      window.addEventListener('cursor-changed', eventListener);

      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.equipCursor('figure-1');
      });

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('cursor-changed', eventListener);
    });

    it('overwrites previous cursor selection', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.equipCursor('figure-1');
      });

      act(() => {
        result.current.equipCursor('figure-2');
      });

      expect(result.current.equippedCursorId).toBe('figure-2');
      expect(localStorage.getItem('equipped_cursor')).toBe('figure-2');
    });
  });

  describe('unequipCursor', () => {
    it('sets equipped cursor id to null', () => {
      localStorage.setItem('equipped_cursor', 'figure-1');
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.unequipCursor();
      });

      expect(result.current.equippedCursorId).toBeNull();
    });

    it('removes cursor from localStorage', () => {
      localStorage.setItem('equipped_cursor', 'figure-1');
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.unequipCursor();
      });

      expect(localStorage.getItem('equipped_cursor')).toBeNull();
    });

    it('dispatches cursor-changed event', () => {
      const eventListener = jest.fn();
      window.addEventListener('cursor-changed', eventListener);

      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.unequipCursor();
      });

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('cursor-changed', eventListener);
    });
  });

  describe('cursor-changed Event Listener', () => {
    it('updates state when cursor-changed event is dispatched', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      expect(result.current.equippedCursorId).toBeNull();

      act(() => {
        localStorage.setItem('equipped_cursor', 'figure-2');
        window.dispatchEvent(new CustomEvent('cursor-changed'));
      });

      expect(result.current.equippedCursorId).toBe('figure-2');
    });

    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useCustomCursor(mockFigures));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('cursor-changed', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('removes cursor style on unmount', () => {
      // Add a style element to simulate cursor being applied
      const style = document.createElement('style');
      style.id = 'global-custom-cursor';
      document.head.appendChild(style);

      const { unmount } = renderHook(() => useCustomCursor(mockFigures));

      unmount();

      expect(document.getElementById('global-custom-cursor')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid equip/unequip calls', () => {
      const { result } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result.current.equipCursor('figure-1');
        result.current.unequipCursor();
        result.current.equipCursor('figure-2');
        result.current.unequipCursor();
        result.current.equipCursor('figure-1');
      });

      expect(result.current.equippedCursorId).toBe('figure-1');
      expect(localStorage.getItem('equipped_cursor')).toBe('figure-1');
    });

    it('handles empty figures array', () => {
      const { result } = renderHook(() => useCustomCursor([]));

      expect(result.current.equippedCursorId).toBeNull();
      
      act(() => {
        result.current.equipCursor('figure-1');
      });

      expect(result.current.equippedCursorId).toBe('figure-1');
    });

    it('handles multiple hook instances syncing via events', () => {
      const { result: result1 } = renderHook(() => useCustomCursor(mockFigures));
      const { result: result2 } = renderHook(() => useCustomCursor(mockFigures));

      act(() => {
        result1.current.equipCursor('figure-1');
      });

      // Second instance should sync via the event
      expect(result1.current.equippedCursorId).toBe('figure-1');
      expect(result2.current.equippedCursorId).toBe('figure-1');
    });

    it('handles figures prop changes', () => {
      const { result, rerender } = renderHook(
        ({ figures }) => useCustomCursor(figures),
        { initialProps: { figures: mockFigures } }
      );

      act(() => {
        result.current.equipCursor('figure-1');
      });

      const newFigures = [
        { id: 'figure-new', image: 'https://example.com/new.png' },
      ];

      rerender({ figures: newFigures });

      expect(result.current.equippedCursorId).toBe('figure-1');
    });
  });
});