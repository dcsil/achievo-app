export const CursorStorage = {
  getEquippedCursor: (): string | null => {
    return localStorage.getItem('equipped_cursor');
  },
  
  setEquippedCursor: (figureId: string | null) => {
    if (figureId) {
      localStorage.setItem('equipped_cursor', figureId);
    } else {
      localStorage.removeItem('equipped_cursor');
    }
  }
};