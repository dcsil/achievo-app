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

  // Obtain Series 2 (since there is only one series)
  // In future expansion, we will fetch directly based on series ID
  const series2 = series.find(s => s.series_id === 'S2') || series[0];
  const blindboxCost = series2?.cost_points || 100;

  const collectibleItems: CollectibleItem[] = figures
    .filter(fig => fig.series_id === 'S2')
    .map(fig => ({
      id: fig.figure_id,
      name: fig.name,
      image: fig.image || '',
      rarity: (fig.rarity || 'common') as 'secret' | 'rare' | 'common'
    }));

  useEffect(() => {
    if (collectibleItems.length > 0) {
      const existingFigures = localStorage.getItem('cursor_figures');
      const newFigures = JSON.stringify(collectibleItems);
      
      if (existingFigures !== newFigures) {
        localStorage.setItem('cursor_figures', newFigures);
        window.dispatchEvent(new CustomEvent('figures-updated'));
      }
    }
  }, [collectibleItems]);

  // Simple cursor functions
  const equipCursor = (figureId: string) => {
    localStorage.setItem('equipped_cursor', figureId);
    window.dispatchEvent(new CustomEvent('cursor-changed'));
  };

  const unequipCursor = () => {
    localStorage.removeItem('equipped_cursor');
    window.dispatchEvent(new CustomEvent('cursor-changed'));
  };

  const equippedCursorId = localStorage.getItem('equipped_cursor');

  const ownedFigureIds = userFigures
    .filter(uf => {
      const figure = figures.find(f => f.figure_id === uf.awarded_figure_id);
      return figure?.series_id === 'S2';
    })
    .map(uf => uf.awarded_figure_id);

  const canAfford = user ? user.total_points >= blindboxCost : false;

  useEffect(() => {
    fetchAllSeries();
    fetchAllFigures();
    
    if (userId) {
      getUserFigures(userId);
    }
  }, [userId]);

  const handlePurchase = async () => {
    if (!userId || !canAfford || isOpening || !series2) return;

    setIsOpening(true);

    try {
      const result = await purchaseBlindBox(userId, series2.series_id);

      if (updateUserPoints) {
        updateUserPoints(result.remaining_points);
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      const revealedFigure: CollectibleItem = {
        id: result.awarded_figure.figure_id,
        name: result.awarded_figure.name,
        image: result.awarded_figure.image || '',
        rarity: (result.awarded_figure.rarity || 'common') as 'secret' | 'rare' | 'common'
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

  const isDuplicate = revealedItem 
    ? userFigures.filter(uf => uf.awarded_figure_id === revealedItem.id).length > 1 
    : false;

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
          seriesImage={series2.image}
          onPurchase={handlePurchase}
        />
      )}

      <CollectionGrid
        items={collectibleItems}
        collection={ownedFigureIds}
        equippedCursorId={equippedCursorId}
        onEquipCursor={equipCursor}
        onUnequipCursor={unequipCursor}
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