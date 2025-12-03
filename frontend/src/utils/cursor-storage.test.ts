import { CursorStorage } from './cursor-storage';

describe('CursorStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getEquippedCursor', () => {
    it('returns null when no cursor is equipped', () => {
      const result = CursorStorage.getEquippedCursor();

      expect(result).toBeNull();
    });

    it('returns the equipped cursor figure id', () => {
      localStorage.setItem('equipped_cursor', 'figure-123');

      const result = CursorStorage.getEquippedCursor();

      expect(result).toBe('figure-123');
    });
  });

  describe('setEquippedCursor', () => {
    it('stores the cursor figure id in localStorage', () => {
      CursorStorage.setEquippedCursor('figure-456');

      expect(localStorage.getItem('equipped_cursor')).toBe('figure-456');
    });

    it('removes the cursor from localStorage when null is passed', () => {
      localStorage.setItem('equipped_cursor', 'figure-789');

      CursorStorage.setEquippedCursor(null);

      expect(localStorage.getItem('equipped_cursor')).toBeNull();
    });

    it('overwrites existing cursor', () => {
      localStorage.setItem('equipped_cursor', 'old-figure');

      CursorStorage.setEquippedCursor('new-figure');

      expect(localStorage.getItem('equipped_cursor')).toBe('new-figure');
    });
  });
});