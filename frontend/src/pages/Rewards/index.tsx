// src/pages/rewards/index.tsx
import React, { useState } from 'react';
import { User } from '../../api-contexts/user-context';
import RewardsHeader from '../../components/rewards/rewards-header';
import MysteryBox from '../../components/rewards/mystery-box';
import CollectionGrid from '../../components/rewards/collection-grid';
import RevealModal from '../../components/rewards/reveal-modal';
import { CollectibleItem } from '../../components/rewards/collection-item';

interface RewardsProps {
  user?: User | null;
  userId?: string;
  updateUserPoints?: (points: number) => void;
}

// Dummy data for Series 1 blindboxes
const SERIES_1_ITEMS: CollectibleItem[] = [
  { id: 1, name: 'Golden Trophy', emoji: '🏆', rarity: 'legendary' },
  { id: 2, name: 'Star Badge', emoji: '⭐', rarity: 'rare' },
  { id: 3, name: 'Fire Medal', emoji: '🔥', rarity: 'rare' },
  { id: 4, name: 'Diamond Gem', emoji: '💎', rarity: 'legendary' },
  { id: 5, name: 'Crown', emoji: '👑', rarity: 'epic' },
  { id: 6, name: 'Rocket', emoji: '🚀', rarity: 'common' },
  { id: 7, name: 'Lightning Bolt', emoji: '⚡', rarity: 'rare' },
  { id: 8, name: 'Magic Wand', emoji: '🪄', rarity: 'epic' },
  { id: 9, name: 'Party Popper', emoji: '🎉', rarity: 'common' },
  { id: 10, name: 'Gift Box', emoji: '🎁', rarity: 'common' },
  { id: 11, name: 'Sparkles', emoji: '✨', rarity: 'rare' },
  { id: 12, name: 'Rainbow', emoji: '🌈', rarity: 'epic' },
];

const BLINDBOX_COST = 100;

const Rewards: React.FC<RewardsProps> = ({ user, updateUserPoints }) => {
  const [collection, setCollection] = useState<number[]>([]); // IDs of owned items
  const [isOpening, setIsOpening] = useState(false);
  const [revealedItem, setRevealedItem] = useState<CollectibleItem | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  const canAfford = user ? user.total_points >= BLINDBOX_COST : false;

  const handlePurchase = async () => {
    if (!user || !updateUserPoints || !canAfford || isOpening) return;

    setIsOpening(true);

    // Deduct coins
    updateUserPoints(user.total_points - BLINDBOX_COST);

    // Simulate opening animation
    await new Promise(resolve => setTimeout(resolve, 800));

    // Randomly select an item
    const randomItem = SERIES_1_ITEMS[Math.floor(Math.random() * SERIES_1_ITEMS.length)];
    setRevealedItem(randomItem);

    // Add to collection if not already owned
    if (!collection.includes(randomItem.id)) {
      setCollection([...collection, randomItem.id]);
    }

    setShowReveal(true);
    setIsOpening(false);
  };

  const closeReveal = () => {
    setShowReveal(false);
    setRevealedItem(null);
  };

  const isDuplicate = revealedItem ? collection.filter(id => id === revealedItem.id).length > 1 : false;

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
      <RewardsHeader user={user || null} />
      
      <MysteryBox
        cost={BLINDBOX_COST}
        canAfford={canAfford}
        isOpening={isOpening}
        userPoints={user?.total_points || 0}
        onPurchase={handlePurchase}
      />

      <CollectionGrid
        items={SERIES_1_ITEMS}
        collection={collection}
      />

      <RevealModal
        isOpen={showReveal}
        item={revealedItem}
        isDuplicate={isDuplicate}
        onClose={closeReveal}
      />
    </div>
  );
};

export default Rewards;