import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import RevealModal from './index';
import { CollectibleItem } from '../collection-item';


describe('RevealModal Component', () => {
  const mockOnClose = jest.fn();

  const mockItem: CollectibleItem = {
    id: 'figure-1',
    name: 'Golden Dragon',
    image: 'https://example.com/dragon.png',
    rarity: 'rare',
  };

  const defaultProps = {
    isOpen: true,
    item: mockItem,
    isDuplicate: false,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderRevealModal = (props = {}) => {
    return render(<RevealModal {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('renders modal when isOpen is true and item exists', () => {
      renderRevealModal();

      expect(screen.getByText('You got!')).toBeInTheDocument();
      expect(screen.getByText('Golden Dragon')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      renderRevealModal({ isOpen: false });

      expect(screen.queryByText('You got!')).not.toBeInTheDocument();
    });

    it('does not render modal when item is null', () => {
      renderRevealModal({ item: null });

      expect(screen.queryByText('You got!')).not.toBeInTheDocument();
    });

    it('renders celebration emoji', () => {
      renderRevealModal();

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('renders item image with correct src and alt', () => {
      renderRevealModal();

      const image = screen.getByAltText('Golden Dragon');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/dragon.png');
    });

    it('renders item name', () => {
      renderRevealModal();

      expect(screen.getByText('Golden Dragon')).toBeInTheDocument();
    });

    it('renders Awesome button', () => {
      renderRevealModal();

      expect(screen.getByRole('button', { name: 'Awesome!' })).toBeInTheDocument();
    });
  });

  describe('Rarity Display', () => {
    it('displays rarity in uppercase', () => {
      renderRevealModal();

      expect(screen.getByText('RARE')).toBeInTheDocument();
    });

    it('displays secret rarity with correct gradient', () => {
      const secretItem = { ...mockItem, rarity: 'secret' as const };
      renderRevealModal({ item: secretItem });

      const rarityBadge = screen.getByText('SECRET');
      expect(rarityBadge).toHaveClass('from-purple-500', 'to-pink-500');
    });

    it('displays rare rarity with correct gradient', () => {
      renderRevealModal();

      const rarityBadge = screen.getByText('RARE');
      expect(rarityBadge).toHaveClass('from-blue-400', 'to-cyan-500');
    });

    it('displays common rarity with correct gradient', () => {
      const commonItem = { ...mockItem, rarity: 'common' as const };
      renderRevealModal({ item: commonItem });

      const rarityBadge = screen.getByText('COMMON');
      expect(rarityBadge).toHaveClass('from-amber-400', 'to-orange-500');
    });

    it('displays unknown rarity with default gradient', () => {
      const unknownItem = { ...mockItem, rarity: 'unknown' as any };
      renderRevealModal({ item: unknownItem });

      const rarityBadge = screen.getByText('UNKNOWN');
      expect(rarityBadge).toHaveClass('from-gray-400', 'to-gray-500');
    });
  });

  describe('Duplicate Display', () => {
    it('shows duplicate message when isDuplicate is true', () => {
      renderRevealModal({ isDuplicate: true });

      expect(screen.getByText('Duplicate! Already in collection')).toBeInTheDocument();
    });

    it('does not show duplicate message when isDuplicate is false', () => {
      renderRevealModal({ isDuplicate: false });

      expect(screen.queryByText('Duplicate! Already in collection')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when Awesome button is clicked', () => {
      renderRevealModal();

      const awesomeButton = screen.getByRole('button', { name: 'Awesome!' });
      fireEvent.click(awesomeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('modal overlay has correct classes', () => {
      const { container } = renderRevealModal();

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-70', 'z-50');
    });

    it('modal content has correct classes', () => {
      const { container } = renderRevealModal();

      const content = container.querySelector('.bg-white.rounded-3xl');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-8', 'max-w-lg', 'text-center');
    });

    it('modal content has minimum height', () => {
      const { container } = renderRevealModal();

      const content = container.querySelector('.bg-white.rounded-3xl');
      expect(content).toHaveStyle({ minHeight: '500px' });
    });

    it('item image has correct classes', () => {
      renderRevealModal();

      const image = screen.getByAltText('Golden Dragon');
      expect(image).toHaveClass('w-48', 'h-48', 'object-contain');
    });

    it('Awesome button has correct styling', () => {
      renderRevealModal();

      const button = screen.getByRole('button', { name: 'Awesome!' });
      expect(button).toHaveClass('px-6', 'py-3', 'rounded-xl', 'font-bold');
      expect(button).toHaveClass('from-orange-500', 'to-pink-500');
    });

    it('rarity badge has correct base styling', () => {
      renderRevealModal();

      const rarityBadge = screen.getByText('RARE');
      expect(rarityBadge).toHaveClass('inline-block', 'px-4', 'py-2', 'rounded-full', 'font-semibold', 'text-white');
    });

    it('duplicate message has correct styling', () => {
      renderRevealModal({ isDuplicate: true });

      const duplicateMessage = screen.getByText('Duplicate! Already in collection');
      expect(duplicateMessage).toHaveClass('text-gray-500', 'text-sm', 'mb-6');
    });
  });

  describe('Animations', () => {
    it('includes style tag with animations', () => {
      const { container } = renderRevealModal();

      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
    });

    it('overlay has fadeIn animation', () => {
      const { container } = renderRevealModal();

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveStyle({ animation: 'fadeIn 0.3s ease-out' });
    });

    it('modal content has popIn animation', () => {
      const { container } = renderRevealModal();

      const content = container.querySelector('.bg-white.rounded-3xl');
      expect(content).toHaveStyle({ animation: 'popIn 0.5s ease-out' });
    });

    it('image has slideUp animation', () => {
      renderRevealModal();

      const image = screen.getByAltText('Golden Dragon');
      expect(image).toHaveStyle({ animation: 'slideUp 0.6s ease-out' });
    });
  });

  describe('Edge Cases', () => {
    it('handles item with long name', () => {
      const longNameItem = { ...mockItem, name: 'This Is A Very Long Item Name That Should Still Display Correctly' };
      renderRevealModal({ item: longNameItem });

      expect(screen.getByText('This Is A Very Long Item Name That Should Still Display Correctly')).toBeInTheDocument();
    });

    it('handles item with special characters in name', () => {
      const specialItem = { ...mockItem, name: "Dragon's Fire & Ice ★" };
      renderRevealModal({ item: specialItem });

      expect(screen.getByText("Dragon's Fire & Ice ★")).toBeInTheDocument();
    });

    it('handles empty image URL', () => {
      const emptyImageItem = { ...mockItem, image: '' };
      renderRevealModal({ item: emptyImageItem });

      const image = screen.getByAltText('Golden Dragon');
      expect(image).toBeNull;
    });

    it('renders correctly when both isOpen is false and item is null', () => {
      const { container } = renderRevealModal({ isOpen: false, item: null });

      expect(container.firstChild).toBeNull();
    });
  });
});