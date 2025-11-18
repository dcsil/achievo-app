import React from 'react';

interface CollectibleItem {
  id: string;
  name: string;
  image: string; // Supabase image URL
  rarity: 'secret' | 'rare' | 'common';
}

interface CollectionGridProps {
  items: CollectibleItem[];
  collection: string[];
}

const CollectionGrid: React.FC<CollectionGridProps> = ({ items, collection }) => {
  // Separate regular items and secret item
  const regularItems = items.filter(item => item.rarity !== 'secret').slice(0, 9);
  const secretItem = items.find(item => item.rarity === 'secret');

  const isOwned = (itemId: string) => collection.includes(itemId);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'secret': return 'from-purple-500 via-pink-500 to-purple-600';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'common': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'secret': return 'shadow-[0_0_30px_rgba(168,85,247,0.6)]';
      case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.3)]';
      default: return '';
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>🎁</span>
        <span>Your Collection</span>
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({collection.length}/{items.length})
        </span>
      </h2>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {regularItems.map((item) => {
          const owned = isOwned(item.id);
          return (
            <div
              key={item.id}
              className={`
                relative aspect-square rounded-xl p-4 
                flex flex-col items-center justify-center
                transition-all duration-300
                ${owned 
                  ? `bg-gradient-to-br ${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)} scale-100 hover:scale-105` 
                  : 'bg-gray-100 hover:bg-gray-200 opacity-50'
                }
              `}
            >
              {/* Rarity indicator */}
              {owned && (
                <div className="absolute top-2 right-2">
                  <div className={`w-2 h-2 rounded-full bg-white shadow-lg`} />
                </div>
              )}

              {/* Image */}
              <div className={`text-5xl mb-2 transition-all duration-300 ${owned ? 'filter-none' : 'grayscale blur-sm'}`}>
                {owned ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">?</div>
                )}
              </div>

              {/* Name */}
              <div className={`text-center text-sm font-medium ${owned ? 'text-white' : 'text-gray-400'}`}>
                {owned ? item.name : '???'}
              </div>

              {/* Lock icon for unowned */}
              {!owned && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl text-gray-400">🔒</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secret Item - Special Section */}
      {secretItem && (
        <div className="mt-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl animate-pulse" />
          
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xl animate-pulse">✨</span>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                Secret Item
              </h3>
              <span className="text-xl animate-pulse">✨</span>
            </div>

            <div className="flex justify-center">
              <div
                className={`
                  relative w-48 aspect-square rounded-2xl p-6
                  flex flex-col items-center justify-center
                  transition-all duration-500
                  ${isOwned(secretItem.id)
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-[0_0_60px_rgba(168,85,247,0.8)] scale-100 hover:scale-105 animate-pulse'
                    : 'bg-gradient-to-br from-gray-800 to-gray-900 opacity-60'
                  }
                `}
              >
                {/* Animated border effect */}
                {isOwned(secretItem.id) && (
                  <div className="absolute inset-0 rounded-2xl">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-75 blur-sm animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10">
                  {/* Stars decoration */}
                  {isOwned(secretItem.id) && (
                    <>
                      <span className="absolute -top-4 -left-4 text-2xl text-yellow-300 animate-pulse">✨</span>
                      <span className="absolute -top-4 -right-4 text-2xl text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }}>✨</span>
                      <span className="absolute -bottom-4 -left-4 text-2xl text-yellow-300 animate-pulse" style={{ animationDelay: '1s' }}>✨</span>
                      <span className="absolute -bottom-4 -right-4 text-2xl text-yellow-300 animate-pulse" style={{ animationDelay: '1.5s' }}>✨</span>
                    </>
                  )}

                  {/* Image */}
                  <div className={`text-7xl mb-3 transition-all duration-300 ${isOwned(secretItem.id) ? 'filter-none animate-bounce' : 'grayscale blur-md'}`}
                       style={{ animationDuration: '2s' }}>
                    {isOwned(secretItem.id) ? (
                      <img 
                        src={secretItem.image} 
                        alt={secretItem.name} 
                        className="w-32 h-32 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center text-gray-600 text-6xl mx-auto">?</div>
                    )}
                  </div>

                  {/* Name */}
                  <div className={`text-center text-lg font-bold ${isOwned(secretItem.id) ? 'text-white' : 'text-gray-500'}`}>
                    {isOwned(secretItem.id) ? secretItem.name : '???'}
                  </div>

                  {/* Rarity badge */}
                  {isOwned(secretItem.id) && (
                    <div className="mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                      ✨ ULTRA RARE ✨
                    </div>
                  )}

                  {/* Lock for unowned */}
                  {!isOwned(secretItem.id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl text-gray-600">🔒</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secret hint */}
            {!isOwned(secretItem.id) && (
              <p className="text-center mt-4 text-sm text-gray-500 italic">
                An extremely rare mystery awaits...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionGrid;