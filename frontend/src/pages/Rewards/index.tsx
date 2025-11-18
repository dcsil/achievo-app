// src/pages/rewards/index.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../../api-contexts/user-context';
import { useBlindBoxSeries } from '../../api-contexts/blindbox/get-blindbox-series';
import { useBlindBoxFigures } from '../../api-contexts/blindbox/get-blindbox-figures';
import { useBlindBoxPurchase } from '../../api-contexts/blindbox/purchase-blindbox';
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

const Rewards: React.FC<RewardsProps> = ({ user, userId, updateUserPoints }) => {
  const { series, fetchAllSeries, loading: seriesLoading } = useBlindBoxSeries();
  const { figures, fetchAllFigures, loading: figuresLoading } = useBlindBoxFigures();
  const { userFigures, purchaseBlindBox, getUserFigures, loading: purchaseLoading } = useBlindBoxPurchase();
  
  const [isOpening, setIsOpening] = useState(false);
  const [revealedItem, setRevealedItem] = useState<CollectibleItem | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  // Get Series 1 (you can make this dynamic later)
  const series2 = series.find(s => s.series_id === 'S2') || series[0];
  const blindboxCost = series2?.cost_points || 100;

  // Convert backend figures to CollectibleItem format
  const collectibleItems: CollectibleItem[] = figures.map(fig => ({
    id: fig.figure_id,
    name: fig.name,
    image: fig.image || '', // Add image from backend
    rarity: (fig.rarity || 'common') as 'secret' | 'rare' | 'common' // Updated rarity types
  }));

  // Get user's owned figure IDs
  const ownedFigureIds = userFigures.map(uf => uf.awarded_figure_id);

  const canAfford = user ? user.total_points >= blindboxCost : false;

  useEffect(() => {
    // Fetch all series and figures on mount
    fetchAllSeries();
    fetchAllFigures();
    
    // Fetch user's collection if userId is available
    if (userId) {
      getUserFigures(userId);
    }
  }, [userId]);

  const handlePurchase = async () => {
    if (!userId || !canAfford || isOpening || !series2) return;

    setIsOpening(true);

    try {
      // Purchase blindbox - this returns the awarded figure
      const result = await purchaseBlindBox(userId, series2.series_id);

      // Update user points in parent component
      if (updateUserPoints) {
        updateUserPoints(result.remaining_points);
      }

      // Simulate opening animation
      await new Promise(resolve => setTimeout(resolve, 800));

      // Set revealed item
      const revealedFigure: CollectibleItem = {
        id: result.awarded_figure.figure_id,
        name: result.awarded_figure.name,
        image: result.awarded_figure.image || '', // Add image from result
        rarity: (result.awarded_figure.rarity || 'common') as 'secret' | 'rare' | 'common' // Updated rarity types
      };
      
      setRevealedItem(revealedFigure);
      setShowReveal(true);
    } catch (error) {
      console.error('Failed to purchase blindbox:', error);
      alert('Failed to purchase blindbox. Please try again.');
    } finally {
      setIsOpening(false);
    }
  };

  const closeReveal = () => {
    setShowReveal(false);
    setRevealedItem(null);
  };

  // Check if the revealed item is a duplicate
  const isDuplicate = revealedItem 
    ? userFigures.filter(uf => uf.awarded_figure_id === revealedItem.id).length > 1 
    : false;

  // Show loading state
  if (seriesLoading || figuresLoading) {
    return (
      <div className="px-6 py-6 max-w-4xl mx-auto pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
      <RewardsHeader user={user || null} />
      
      {series2 && (
        <MysteryBox
          seriesName={series2.name}
          description={series2.description || 'Collect unique items!'}
          cost={blindboxCost}
          canAfford={canAfford}
          isOpening={isOpening}
          userPoints={user?.total_points || 0}
          seriesImage={series2.image} // Add series cover image
          onPurchase={handlePurchase}
        />
      )}

      <CollectionGrid
        items={collectibleItems}
        collection={ownedFigureIds}
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