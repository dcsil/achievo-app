// src/components/rewards/collection-grid/index.tsx
import React from 'react';
import CollectionItem, { CollectibleItem } from '../collection-item';

interface CollectionGridProps {
  items: CollectibleItem[];
  collection: number[];
}

const CollectionGrid: React.FC<CollectionGridProps> = ({ items, collection }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mx-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Your Collection</h2>
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
          {collection.length} / {items.length}
        </span>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const isOwned = collection.includes(item.id);
          return (
            <CollectionItem 
              key={item.id} 
              item={item} 
              isOwned={isOwned} 
            />
          );
        })}
      </div>
    </div>
  );
};

export default CollectionGrid;