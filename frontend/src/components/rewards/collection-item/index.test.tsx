import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CollectionItem, { CollectibleItem } from './index';

const mockCommonItem: CollectibleItem = {
  id: '1',
  name: 'Bronze Paw',
  image: 'https://example.com/bronze-paw.png',
  rarity: 'common',
};

const mockRareItem: CollectibleItem = {
  id: '2',
  name: 'Ruby Gem',
  image: 'https://example.com/ruby-gem.png',
  rarity: 'rare',
};

const mockSecretItem: CollectibleItem = {
  id: '3',
  name: 'Legendary Phoenix',
  image: 'https://example.com/phoenix.png',
  rarity: 'secret',
};

describe('CollectionItem Component', () => {
  describe('Owned Item Display', () => {
    it('displays item name when owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(screen.getByText('Bronze Paw')).toBeInTheDocument();
    });

    it('displays item image when owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const image = screen.getByAltText('Bronze Paw');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/bronze-paw.png');
    });

    it('displays rarity badge when owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(screen.getByText('common')).toBeInTheDocument();
    });

    it('displays rare rarity badge for rare item', () => {
      render(<CollectionItem item={mockRareItem} isOwned={true} />);

      expect(screen.getByText('rare')).toBeInTheDocument();
    });

    it('displays secret rarity badge for secret item', () => {
      render(<CollectionItem item={mockSecretItem} isOwned={true} />);

      expect(screen.getByText('secret')).toBeInTheDocument();
    });

    it('does not display locked text when owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(screen.queryByText('Locked')).not.toBeInTheDocument();
    });

    it('does not display question mark when owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(screen.queryByText('?')).not.toBeInTheDocument();
    });
  });

  describe('Unowned Item Display', () => {
    it('displays question mark when not owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('displays locked text when not owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      expect(screen.getByText('Locked')).toBeInTheDocument();
    });

    it('does not display item name when not owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      expect(screen.queryByText('Bronze Paw')).not.toBeInTheDocument();
    });

    it('does not display item image when not owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      expect(screen.queryByAltText('Bronze Paw')).not.toBeInTheDocument();
    });

    it('does not display rarity badge when not owned', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      expect(screen.queryByText('common')).not.toBeInTheDocument();
    });
  });

  describe('Rarity Styling - Common', () => {
    it('applies common border styling when owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('border-gray-300');
    });

    it('applies common badge styling when owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const badge = screen.getByText('common');
      expect(badge).toHaveClass('bg-gray-200', 'text-gray-800');
    });

    it('applies white background when owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('bg-white');
    });

    it('applies shadow when owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('shadow-lg');
    });
  });

  describe('Rarity Styling - Rare', () => {
    it('applies rare border styling when owned', () => {
      const { container } = render(<CollectionItem item={mockRareItem} isOwned={true} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('border-blue-400');
    });

    it('applies rare badge styling when owned', () => {
      render(<CollectionItem item={mockRareItem} isOwned={true} />);

      const badge = screen.getByText('rare');
      expect(badge).toHaveClass('bg-blue-200', 'text-blue-800');
    });
  });

  describe('Rarity Styling - Secret', () => {
    it('applies secret border styling when owned', () => {
      const { container } = render(<CollectionItem item={mockSecretItem} isOwned={true} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('border-purple-400');
    });

    it('applies secret badge styling when owned', () => {
      render(<CollectionItem item={mockSecretItem} isOwned={true} />);

      const badge = screen.getByText('secret');
      expect(badge).toHaveClass('bg-purple-200', 'text-purple-800');
    });
  });

  describe('Unowned Styling', () => {
    it('applies gray border when not owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('border-gray-200');
    });

    it('applies gray background when not owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      const itemCard = container.firstChild;
      expect(itemCard).toHaveClass('bg-gray-50');
    });

    it('does not apply shadow when not owned', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      const itemCard = container.firstChild;
      expect(itemCard).not.toHaveClass('shadow-lg');
    });

    it('applies same styling regardless of item rarity when not owned', () => {
      const { container: commonContainer } = render(
        <CollectionItem item={mockCommonItem} isOwned={false} />
      );
      const { container: rareContainer } = render(
        <CollectionItem item={mockRareItem} isOwned={false} />
      );
      const { container: secretContainer } = render(
        <CollectionItem item={mockSecretItem} isOwned={false} />
      );

      expect(commonContainer.firstChild).toHaveClass('border-gray-200', 'bg-gray-50');
      expect(rareContainer.firstChild).toHaveClass('border-gray-200', 'bg-gray-50');
      expect(secretContainer.firstChild).toHaveClass('border-gray-200', 'bg-gray-50');
    });
  });

  describe('Card Structure', () => {
    it('renders as a div element', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('has aspect-square class', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(container.firstChild).toHaveClass('aspect-square');
    });

    it('has rounded corners', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(container.firstChild).toHaveClass('rounded-xl');
    });

    it('has border styling', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(container.firstChild).toHaveClass('border-2');
    });

    it('has flex layout', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('has transition styling', () => {
      const { container } = render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      expect(container.firstChild).toHaveClass('transition-all');
    });
  });

  describe('Image Styling', () => {
    it('image has object-contain class', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const image = screen.getByAltText('Bronze Paw');
      expect(image).toHaveClass('object-contain');
    });

    it('image has max-width and max-height classes', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const image = screen.getByAltText('Bronze Paw');
      expect(image).toHaveClass('max-w-full', 'max-h-full');
    });
  });

  describe('Text Styling', () => {
    it('item name has correct text styling', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const nameElement = screen.getByText('Bronze Paw');
      expect(nameElement).toHaveClass('text-xs', 'font-semibold', 'text-gray-700', 'text-center');
    });

    it('locked text has correct styling', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      const lockedText = screen.getByText('Locked');
      expect(lockedText).toHaveClass('text-xs', 'text-gray-400');
    });

    it('question mark has correct styling', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={false} />);

      const questionMark = screen.getByText('?');
      expect(questionMark).toHaveClass('text-5xl', 'text-gray-300');
    });
  });

  describe('Badge Styling', () => {
    it('rarity badge has correct base styling', () => {
      render(<CollectionItem item={mockCommonItem} isOwned={true} />);

      const badge = screen.getByText('common');
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5', 'rounded-full', 'mt-1');
    });
  });

  describe('Edge Cases', () => {
    it('handles item with long name', () => {
      const longNameItem: CollectibleItem = {
        id: '999',
        name: 'This Is A Very Long Item Name That Should Still Display',
        image: 'https://example.com/long-name.png',
        rarity: 'common',
      };

      render(<CollectionItem item={longNameItem} isOwned={true} />);

      expect(screen.getByText('This Is A Very Long Item Name That Should Still Display')).toBeInTheDocument();
    });

    it('handles item with special characters in name', () => {
      const specialItem: CollectibleItem = {
        id: '888',
        name: "Dragon's Fire & Ice ★",
        image: 'https://example.com/special.png',
        rarity: 'rare',
      };

      render(<CollectionItem item={specialItem} isOwned={true} />);

      expect(screen.getByText("Dragon's Fire & Ice ★")).toBeInTheDocument();
    });

    it('handles empty image URL', () => {
      const emptyImageItem: CollectibleItem = {
        id: '777',
        name: 'No Image Item',
        image: '',
        rarity: 'common',
      };

      render(<CollectionItem item={emptyImageItem} isOwned={true} />);

      const image = screen.getByAltText('No Image Item');
      expect(image).toBeNull;
    });
  });
});