// src/components/rewards/collection-item/index.tsx
import React from 'react';

export interface CollectibleItem {
  id: string;
  name: string;
  image: string; // Supabase image URL
  rarity: 'secret' | 'rare' | 'common';
}

interface CollectionItemProps {
  item: CollectibleItem;
  isOwned: boolean;
}

const CollectionItem: React.FC<CollectionItemProps> = ({ item, isOwned }) => {
  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'secret': return 'border-purple-400 shadow-purple-400/50';
      case 'rare': return 'border-blue-400 shadow-blue-400/50';
      case 'common': return 'border-gray-300 shadow-gray-300/50';
      default: return 'border-gray-300 shadow-gray-300/50';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'secret': return 'bg-purple-200 text-purple-800';
      case 'rare': return 'bg-blue-200 text-blue-800';
      case 'common': return 'bg-gray-200 text-gray-800';
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
          <div className="w-full h-20 flex items-center justify-center mb-2 px-2">
            <img 
              src={item.image} 
              alt={item.name} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <p className="text-xs font-semibold text-gray-700 text-center px-1">
            {item.name}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${getRarityBadge(item.rarity)}`}>
            {item.rarity}
          </span>
        </>
      ) : (
        <>
          <div className="text-5xl mb-2 text-gray-300">?</div>
          <p className="text-xs text-gray-400">Locked</p>
        </>
      )}
    </div>
  );
};

export default CollectionItem;