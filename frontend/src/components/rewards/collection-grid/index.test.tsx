import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionGrid from './index';

const mockItems = [
  { id: '1', name: 'Bronze Paw', image: '/images/paw1.png', rarity: 'common' as const },
  { id: '2', name: 'Silver Paw', image: '/images/paw2.png', rarity: 'common' as const },
  { id: '3', name: 'Gold Paw', image: '/images/paw3.png', rarity: 'common' as const },
  { id: '4', name: 'Ruby Gem', image: '/images/gem1.png', rarity: 'rare' as const },
  { id: '5', name: 'Sapphire Gem', image: '/images/gem2.png', rarity: 'rare' as const },
  { id: '6', name: 'Emerald Gem', image: '/images/gem3.png', rarity: 'rare' as const },
  { id: '7', name: 'Diamond Star', image: '/images/star1.png', rarity: 'common' as const },
  { id: '8', name: 'Platinum Star', image: '/images/star2.png', rarity: 'rare' as const },
  { id: '9', name: 'Cosmic Star', image: '/images/star3.png', rarity: 'rare' as const },
  { id: '10', name: 'Legendary Phoenix', image: '/images/phoenix.png', rarity: 'secret' as const },
];

describe('CollectionGrid Component', () => {
  const mockOnEquipCursor = jest.fn();
  const mockOnUnequipCursor = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderCollectionGrid = (props = {}) => {
    const defaultProps = {
      items: mockItems,
      collection: [],
      equippedCursorId: null,
      onEquipCursor: mockOnEquipCursor,
      onUnequipCursor: mockOnUnequipCursor,
    };
    return render(<CollectionGrid {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('renders collection header', () => {
      renderCollectionGrid();

      expect(screen.getByText('Your Collection')).toBeInTheDocument();
      expect(screen.getByText('🎁')).toBeInTheDocument();
    });

    it('renders collection count', () => {
      renderCollectionGrid({ collection: ['1', '2', '3'] });

      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('renders zero collection count when empty', () => {
      renderCollectionGrid({ collection: [] });

      expect(screen.getByText('0/10')).toBeInTheDocument();
    });

    it('renders all regular items (1-9)', () => {
      renderCollectionGrid();

      // Should show 9 lock icons for unowned items
      const lockIcons = screen.getAllByText('🔒');
      expect(lockIcons.length).toBeGreaterThanOrEqual(9);
    });

    it('renders secret item section', () => {
      renderCollectionGrid();

      expect(screen.getByText('Ultra Rare Secret')).toBeInTheDocument();
    });

    it('renders sparkle emojis for secret section', () => {
      renderCollectionGrid();

      const sparkles = screen.getAllByText('✨');
      expect(sparkles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Owned Items Display', () => {
    it('displays item name when owned', () => {
      renderCollectionGrid({ collection: ['1'] });

      expect(screen.getByText('Bronze Paw')).toBeInTheDocument();
    });

    it('displays item image when owned', () => {
      renderCollectionGrid({ collection: ['1'] });

      const image = screen.getByAltText('Bronze Paw');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/paw1.png');
    });

    it('displays ??? for unowned items', () => {
      renderCollectionGrid({ collection: [] });

      const questionMarks = screen.getAllByText('???');
      expect(questionMarks.length).toBeGreaterThan(0);
    });

    it('displays lock icon for unowned items', () => {
      renderCollectionGrid({ collection: [] });

      const lockIcons = screen.getAllByText('🔒');
      expect(lockIcons.length).toBeGreaterThan(0);
    });

    it('displays rarity badge for owned items', () => {
      renderCollectionGrid({ collection: ['1', '4'] });

      // Common rarity for item 1
      expect(screen.getByText('COMMON')).toBeInTheDocument();
      // Rare rarity for item 4
      expect(screen.getByText('RARE')).toBeInTheDocument();
    });

    it('counts unique items in collection', () => {
      // Duplicate items should only count once
      renderCollectionGrid({ collection: ['1', '1', '2', '2', '3'] });

      expect(screen.getByText('3/10')).toBeInTheDocument();
    });
  });

  describe('Secret Item', () => {
    it('displays secret item when owned', () => {
      renderCollectionGrid({ collection: ['10'] });

      expect(screen.getByText('Legendary Phoenix')).toBeInTheDocument();
    });

    it('displays secret item image when owned', () => {
      renderCollectionGrid({ collection: ['10'] });

      const image = screen.getByAltText('Legendary Phoenix');
      expect(image).toBeInTheDocument();
    });

    it('displays SECRET badge when owned', () => {
      renderCollectionGrid({ collection: ['10'] });

      expect(screen.getByText('SECRET')).toBeInTheDocument();
    });

    it('displays LOCKED badge when secret item not owned', () => {
      renderCollectionGrid({ collection: [] });

      expect(screen.getByText('LOCKED')).toBeInTheDocument();
    });

    it('displays mystery message when secret item not owned', () => {
      renderCollectionGrid({ collection: [] });

      expect(screen.getByText('A legendary mystery awaits...')).toBeInTheDocument();
    });

    it('displays corner sparkles when secret item is owned', () => {
      renderCollectionGrid({ collection: ['10'] });

      const sparkles = screen.getAllByText('✨');
      expect(sparkles.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Equip Functionality', () => {
    it('displays equip button for owned items', () => {
      renderCollectionGrid({ collection: ['1'] });

      expect(screen.getByText('Equip Cursor')).toBeInTheDocument();
    });

    it('calls onEquipCursor when equip button is clicked', () => {
      renderCollectionGrid({ collection: ['1'] });

      const equipButton = screen.getByText('Equip Cursor');
      fireEvent.click(equipButton);

      expect(mockOnEquipCursor).toHaveBeenCalledWith('1');
    });

    it('displays equipped state for equipped item', () => {
      renderCollectionGrid({ collection: ['1'], equippedCursorId: '1' });

      expect(screen.getByText('✓ Equipped')).toBeInTheDocument();
    });

    it('calls onUnequipCursor when equipped item button is clicked', () => {
      renderCollectionGrid({ collection: ['1'], equippedCursorId: '1' });

      const unequipButton = screen.getByText('✓ Equipped');
      fireEvent.click(unequipButton);

      expect(mockOnUnequipCursor).toHaveBeenCalled();
    });

    it('does not display equip button for unowned items', () => {
      renderCollectionGrid({ collection: [] });

      expect(screen.queryByText('Equip Cursor')).not.toBeInTheDocument();
    });

    it('displays equip button for secret item when owned', () => {
      renderCollectionGrid({ collection: ['10'] });

      expect(screen.getByText('Equip Cursor')).toBeInTheDocument();
    });

    it('calls onEquipCursor for secret item', () => {
      renderCollectionGrid({ collection: ['10'] });

      const equipButton = screen.getByText('Equip Cursor');
      fireEvent.click(equipButton);

      expect(mockOnEquipCursor).toHaveBeenCalledWith('10');
    });

    it('displays equipped state for equipped secret item', () => {
      renderCollectionGrid({ collection: ['10'], equippedCursorId: '10' });

      expect(screen.getByText('✓ Equipped')).toBeInTheDocument();
    });

    it('calls onUnequipCursor for equipped secret item', () => {
      renderCollectionGrid({ collection: ['10'], equippedCursorId: '10' });

      const unequipButton = screen.getByText('✓ Equipped');
      fireEvent.click(unequipButton);

      expect(mockOnUnequipCursor).toHaveBeenCalled();
    });
  });

  describe('Without Equip Functions', () => {
    it('does not display equip button when onEquipCursor is not provided', () => {
      render(
        <CollectionGrid
          items={mockItems}
          collection={['1']}
          equippedCursorId={null}
        />
      );

      expect(screen.queryByText('Equip Cursor')).not.toBeInTheDocument();
    });

    it('does not display equip button when onUnequipCursor is not provided', () => {
      render(
        <CollectionGrid
          items={mockItems}
          collection={['1']}
          equippedCursorId={null}
          onEquipCursor={mockOnEquipCursor}
        />
      );

      expect(screen.queryByText('Equip Cursor')).not.toBeInTheDocument();
    });
  });

  describe('Item Sorting', () => {
    it('sorts items by ID correctly', () => {
      const unsortedItems = [
        { id: '9', name: 'Item 9', image: '/img9.png', rarity: 'common' as const },
        { id: '1', name: 'Item 1', image: '/img1.png', rarity: 'common' as const },
        { id: '5', name: 'Item 5', image: '/img5.png', rarity: 'common' as const },
      ];

      render(
        <CollectionGrid
          items={unsortedItems}
          collection={['1', '5', '9']}
          equippedCursorId={null}
          onEquipCursor={mockOnEquipCursor}
          onUnequipCursor={mockOnUnequipCursor}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 5')).toBeInTheDocument();
      expect(screen.getByText('Item 9')).toBeInTheDocument();
    });
  });

  describe('Rarity Styling', () => {
    it('applies common rarity styling to common items', () => {
      const { container } = renderCollectionGrid({ collection: ['1'] });

      const itemCard = container.querySelector('.from-amber-400');
      expect(itemCard).toBeInTheDocument();
    });

    it('applies rare rarity styling to rare items', () => {
      const { container } = renderCollectionGrid({ collection: ['4'] });

      const itemCard = container.querySelector('.from-blue-400');
      expect(itemCard).toBeInTheDocument();
    });

    it('applies secret rarity styling to secret items', () => {
      const { container } = renderCollectionGrid({ collection: ['10'] });

      const itemCard = container.querySelector('.from-purple-500');
      expect(itemCard).toBeInTheDocument();
    });

    it('applies gray styling to unowned items', () => {
      const { container } = renderCollectionGrid({ collection: [] });

      const grayItems = container.querySelectorAll('.from-gray-100');
      expect(grayItems.length).toBeGreaterThan(0);
    });
  });

  describe('Equipped Item Styling', () => {
    it('applies ring styling to equipped item', () => {
      const { container } = renderCollectionGrid({ collection: ['1'], equippedCursorId: '1' });

      const equippedItem = container.querySelector('.ring-yellow-400');
      expect(equippedItem).toBeInTheDocument();
    });

    it('applies ring styling to equipped secret item', () => {
      const { container } = renderCollectionGrid({ collection: ['10'], equippedCursorId: '10' });

      const equippedItem = container.querySelector('.ring-yellow-400');
      expect(equippedItem).toBeInTheDocument();
    });
  });

  describe('Empty Secret Item', () => {
    it('renders placeholder when secret item does not exist', () => {
      const itemsWithoutSecret = mockItems.filter(item => item.id !== '10');

      render(
        <CollectionGrid
          items={itemsWithoutSecret}
          collection={[]}
          equippedCursorId={null}
          onEquipCursor={mockOnEquipCursor}
          onUnequipCursor={mockOnUnequipCursor}
        />
      );

      expect(screen.getByText('Ultra Rare Secret')).toBeInTheDocument();
      expect(screen.getByText('A legendary mystery awaits...')).toBeInTheDocument();
    });
  });

  describe('Multiple Owned Items', () => {
    it('displays multiple owned items correctly', () => {
      renderCollectionGrid({ collection: ['1', '2', '3', '4', '5'] });

      expect(screen.getByText('Bronze Paw')).toBeInTheDocument();
      expect(screen.getByText('Silver Paw')).toBeInTheDocument();
      expect(screen.getByText('Gold Paw')).toBeInTheDocument();
      expect(screen.getByText('Ruby Gem')).toBeInTheDocument();
      expect(screen.getByText('Sapphire Gem')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('displays all items as owned when collection is complete', () => {
      renderCollectionGrid({ 
        collection: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] 
      });

      expect(screen.getByText('10/10')).toBeInTheDocument();
      expect(screen.getByText('Legendary Phoenix')).toBeInTheDocument();
      expect(screen.getByText('SECRET')).toBeInTheDocument();
    });
  });
});