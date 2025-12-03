import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import MysteryBox from './index';

describe('MysteryBox Component', () => {
  const mockOnPurchase = jest.fn();

  const defaultProps = {
    seriesName: 'Spring Collection',
    description: 'Collect adorable spring-themed items!',
    cost: 100,
    canAfford: true,
    isOpening: false,
    userPoints: 150,
    onPurchase: mockOnPurchase,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderMysteryBox = (props = {}) => {
    return render(<MysteryBox {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('renders series name', () => {
      renderMysteryBox();

      expect(screen.getByText('Spring Collection')).toBeInTheDocument();
    });

    it('renders description', () => {
      renderMysteryBox();

      expect(screen.getByText('Collect adorable spring-themed items!')).toBeInTheDocument();
    });

    it('renders purchase button', () => {
      renderMysteryBox();

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders cost in button', () => {
      renderMysteryBox();

      const costElements = screen.getAllByText(/100/);
      expect(costElements.length).toBeGreaterThan(0);
    });

    it('renders coin emoji in button', () => {
      renderMysteryBox();

      const coinElements = screen.getAllByText(/🪙/);
      expect(coinElements.length).toBeGreaterThan(0);
    });
  });

  describe('Series Image', () => {
    it('renders series image when provided', () => {
      renderMysteryBox({ seriesImage: 'https://example.com/series.png' });

      const image = screen.getByAltText('Spring Collection');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/series.png');
    });

    it('renders placeholder when no image provided', () => {
      renderMysteryBox({ seriesImage: undefined });

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('does not render image when isOpening is true', () => {
      renderMysteryBox({ seriesImage: 'https://example.com/series.png', isOpening: true });

      expect(screen.queryByAltText('Spring Collection')).not.toBeInTheDocument();
    });
  });

  describe('Opening State', () => {
    it('displays gift emoji when opening', () => {
      renderMysteryBox({ isOpening: true });

      const giftEmojis = screen.getAllByText('🎁');
      expect(giftEmojis.length).toBeGreaterThan(0);
    });

    it('displays opening text when opening', () => {
      renderMysteryBox({ isOpening: true });

      const openingElements = screen.getAllByText(/Opening/);
      expect(openingElements.length).toBeGreaterThan(0);
    });

    it('disables button when opening', () => {
      renderMysteryBox({ isOpening: true });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('hides series image when opening', () => {
      renderMysteryBox({ seriesImage: 'https://example.com/series.png', isOpening: true });

      expect(screen.queryByAltText('Spring Collection')).not.toBeInTheDocument();
    });

    it('hides placeholder when opening', () => {
      renderMysteryBox({ isOpening: true });

      const questionMarks = screen.queryAllByText('?');
      expect(questionMarks.length).toBe(0);
    });
  });

  describe('Afford State', () => {
    it('enables button when can afford', () => {
      renderMysteryBox({ canAfford: true });

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('disables button when cannot afford', () => {
      renderMysteryBox({ canAfford: false });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('displays points needed message when cannot afford', () => {
      renderMysteryBox({ canAfford: false, userPoints: 50, cost: 100 });

      expect(screen.getByText('Need 50 more points!')).toBeInTheDocument();
    });

    it('does not display points needed message when can afford', () => {
      renderMysteryBox({ canAfford: true });

      expect(screen.queryByText(/Need.*more points!/)).not.toBeInTheDocument();
    });

    it('calculates correct points needed', () => {
      renderMysteryBox({ canAfford: false, userPoints: 25, cost: 100 });

      expect(screen.getByText('Need 75 more points!')).toBeInTheDocument();
    });

    it('shows zero points needed when exactly at cost', () => {
      renderMysteryBox({ canAfford: false, userPoints: 100, cost: 100 });

      expect(screen.getByText('Need 0 more points!')).toBeInTheDocument();
    });
  });

  describe('Purchase Button', () => {
    it('calls onPurchase when clicked', () => {
      renderMysteryBox();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnPurchase).toHaveBeenCalledTimes(1);
    });

    it('does not call onPurchase when disabled due to cannot afford', () => {
      renderMysteryBox({ canAfford: false });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnPurchase).not.toHaveBeenCalled();
    });

    it('does not call onPurchase when disabled due to opening', () => {
      renderMysteryBox({ isOpening: true });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnPurchase).not.toHaveBeenCalled();
    });

    it('displays Open Blindbox text when not opening', () => {
      renderMysteryBox();

      const openBlindboxElements = screen.getAllByText(/Open.*Blindbox/);
      expect(openBlindboxElements.length).toBeGreaterThan(0);
    });
  });

  describe('Button Styling', () => {
    it('applies gradient styling when can afford and not opening', () => {
      renderMysteryBox({ canAfford: true, isOpening: false });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-pink-500');
    });

    it('applies gray styling when cannot afford', () => {
      renderMysteryBox({ canAfford: false });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200', 'text-gray-400', 'cursor-not-allowed');
    });

    it('applies gray styling when opening', () => {
      renderMysteryBox({ isOpening: true });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200', 'text-gray-400', 'cursor-not-allowed');
    });

    it('applies hover styles when can afford', () => {
      renderMysteryBox({ canAfford: true, isOpening: false });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-105', 'hover:shadow-2xl');
    });
  });

  describe('Card Structure', () => {
    it('renders card with white background', () => {
      const { container } = renderMysteryBox();

      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
    });

    it('renders card with rounded corners', () => {
      const { container } = renderMysteryBox();

      const card = container.firstChild;
      expect(card).toHaveClass('rounded-3xl');
    });

    it('renders card with shadow', () => {
      const { container } = renderMysteryBox();

      const card = container.firstChild;
      expect(card).toHaveClass('shadow-xl');
    });

    it('renders card with overflow hidden', () => {
      const { container } = renderMysteryBox();

      const card = container.firstChild;
      expect(card).toHaveClass('overflow-hidden');
    });
  });

  describe('Image Section', () => {
    it('has gradient background', () => {
      const { container } = renderMysteryBox();

      const imageSection = container.querySelector('.bg-gradient-to-b');
      expect(imageSection).toBeInTheDocument();
    });

    it('image has drop shadow styling', () => {
      renderMysteryBox({ seriesImage: 'https://example.com/series.png' });

      const image = screen.getByAltText('Spring Collection');
      expect(image).toHaveClass('drop-shadow-2xl');
    });

    it('image has object-contain class', () => {
      renderMysteryBox({ seriesImage: 'https://example.com/series.png' });

      const image = screen.getByAltText('Spring Collection');
      expect(image).toHaveClass('object-contain');
    });
  });

  describe('Placeholder Styling', () => {
    it('placeholder has gradient background', () => {
      const { container } = renderMysteryBox({ seriesImage: undefined });

      const placeholder = container.querySelector('.from-orange-400');
      expect(placeholder).toBeInTheDocument();
    });

    it('placeholder displays question mark', () => {
      renderMysteryBox({ seriesImage: undefined });

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('placeholder has rounded corners', () => {
      const { container } = renderMysteryBox({ seriesImage: undefined });

      const placeholder = container.querySelector('.rounded-2xl');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Opening Animation', () => {
    it('gift emoji has bounce animation', () => {
      const { container } = renderMysteryBox({ isOpening: true });

      const bouncingGiftEmoji = container.querySelector('.animate-bounce');
      expect(bouncingGiftEmoji).toBeInTheDocument();
      expect(bouncingGiftEmoji).toHaveTextContent('🎁');
    });

    it('opening container has fade-in animation', () => {
      const { container } = renderMysteryBox({ isOpening: true });

      const fadeInContainer = container.querySelector('.animate-fade-in');
      expect(fadeInContainer).toBeInTheDocument();
    });

    it('opening container has minimum height', () => {
      const { container } = renderMysteryBox({ isOpening: true });

      const fadeInContainer = container.querySelector('.animate-fade-in');
      expect(fadeInContainer).toHaveStyle({ minHeight: '300px' });
    });
  });

  describe('Text Styling', () => {
    it('series name has correct styling', () => {
      renderMysteryBox();

      const seriesName = screen.getByText('Spring Collection');
      expect(seriesName).toHaveClass('font-bold', 'text-gray-900');
    });

    it('description has correct styling', () => {
      renderMysteryBox();

      const description = screen.getByText('Collect adorable spring-themed items!');
      expect(description).toHaveClass('text-gray-600');
    });

    it('points needed message has red color', () => {
      renderMysteryBox({ canAfford: false, userPoints: 50, cost: 100 });

      const message = screen.getByText('Need 50 more points!');
      expect(message).toHaveClass('text-red-500');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero cost', () => {
      renderMysteryBox({ cost: 0 });

      const costElements = screen.getAllByText(/0/);
      expect(costElements.length).toBeGreaterThan(0);
    });

    it('handles very high cost', () => {
      renderMysteryBox({ cost: 999999 });

      const costElements = screen.getAllByText(/999999/);
      expect(costElements.length).toBeGreaterThan(0);
    });

    it('handles long series name', () => {
      renderMysteryBox({ seriesName: 'This Is A Very Long Series Name That Should Still Display' });

      expect(screen.getByText('This Is A Very Long Series Name That Should Still Display')).toBeInTheDocument();
    });

    it('handles long description', () => {
      renderMysteryBox({ 
        description: 'This is a very long description that explains what this mystery box contains and why you should purchase it.' 
      });

      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });

    it('handles special characters in series name', () => {
      renderMysteryBox({ seriesName: "Dragon's Fire & Ice ★" });

      expect(screen.getByText("Dragon's Fire & Ice ★")).toBeInTheDocument();
    });

    it('handles zero user points', () => {
      renderMysteryBox({ canAfford: false, userPoints: 0, cost: 100 });

      expect(screen.getByText('Need 100 more points!')).toBeInTheDocument();
    });
  });

  describe('Style Tag', () => {
    it('includes custom animation styles', () => {
      const { container } = renderMysteryBox();

      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
    });
  });
});