// src/components/rewards/collection-item/index.tsx
import React from 'react';

export interface CollectibleItem {
  id: number;
  name: string;
  emoji: string;
  rarity: 'legendary' | 'epic' | 'rare' | 'common';
}

interface CollectionItemProps {
  item: CollectibleItem;
  isOwned: boolean;
}

const CollectionItem: React.FC<CollectionItemProps> = ({ item, isOwned }) => {
  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-400/50';
      case 'epic': return 'border-purple-400 shadow-purple-400/50';
      case 'rare': return 'border-blue-400 shadow-blue-400/50';
      default: return 'border-gray-300 shadow-gray-300/50';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-200 text-yellow-800';
      case 'epic': return 'bg-purple-200 text-purple-800';
      case 'rare': return 'bg-blue-200 text-blue-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
        isOwned
          ? `${getRarityBorder(item.rarity)} bg-white shadow-lg`
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {isOwned ? (
        <>
          <div className="text-5xl mb-2">{item.emoji}</div>
          <p className="text-xs font-semibold text-gray-700 text-center px-1">
            {item.name}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${getRarityBadge(item.rarity)}`}>
            {item.rarity}
          </span>
        </>
      ) : (
        <>
          <div className="text-5xl mb-2 opacity-20">❓</div>
          <p className="text-xs text-gray-400">Locked</p>
        </>
      )}
    </div>
  );
};

export default CollectionItem;