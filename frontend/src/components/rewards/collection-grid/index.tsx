import React from 'react';

interface CollectibleItem {
  id: string;
  name: string;
  image: string;
  rarity: 'secret' | 'rare' | 'common';
}

interface CollectionGridProps {
  items: CollectibleItem[];
  collection: string[];
  equippedCursorId?: string | null;
  onEquipCursor?: (figureId: string) => void;
  onUnequipCursor?: () => void;
}

const CollectionGrid: React.FC<CollectionGridProps> = ({ 
  items, 
  collection, 
  equippedCursorId, 
  onEquipCursor, 
  onUnequipCursor 
}) => {
  // Sort items by ID to ensure consistent ordering (1-9, then 10)
  const sortedItems = [...items].sort((a, b) => {
    const aNum = parseInt(a.id) || 0;
    const bNum = parseInt(b.id) || 0;
    return aNum - bNum;
  });

  // Items 1-9 go in the regular grid
  const regularItems = sortedItems.filter(item => {
    const itemNum = parseInt(item.id) || 0;
    return itemNum >= 1 && itemNum <= 9;
  });

  // Item 10 is the secret item
  const secretItem = sortedItems.find(item => {
    const itemNum = parseInt(item.id) || 0;
    return itemNum === 10;
  });

  const isOwned = (itemId: string) => collection.includes(itemId);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'secret': return 'from-purple-500 via-pink-500 to-purple-600';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'common': return 'from-amber-400 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'secret': return 'shadow-[0_0_40px_rgba(168,85,247,0.5)]';
      case 'rare': return 'shadow-[0_0_25px_rgba(59,130,246,0.4)]';
      case 'common': return 'shadow-[0_0_20px_rgba(251,146,60,0.3)]';
      default: return '';
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-3xl sm:text-4xl">🎁</span>
          <span>Your Collection</span>
        </h2>
        <span className="text-xl sm:text-2xl font-bold text-gray-500">
          {new Set(collection).size}/10
        </span>
      </div>

      {/* 3x3 Grid - Responsive sizing */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-12">
        {regularItems.map((item) => {
          const owned = isOwned(item.id);
          const isEquipped = equippedCursorId === item.id;
          
          return (
            <div
              key={item.id}
              className={`
                relative rounded-xl p-2 sm:p-4 
                flex flex-col items-center justify-between
                transition-all duration-300
                ${owned 
                  ? `bg-gradient-to-br ${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)} hover:scale-105` 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'
                }
                ${isEquipped ? 'ring-2 sm:ring-4 ring-yellow-400 ring-offset-1 sm:ring-offset-2' : ''}
              `}
              style={{ height: '180px' }} // Reduced height for mobile
            >
              {/* Image Container */}
              <div className={`flex items-center justify-center mb-2 ${owned ? '' : 'opacity-30'}`} style={{ height: '70px' }}>
                {owned ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="max-h-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="text-3xl sm:text-5xl text-gray-400">🔒</div>
                )}
              </div>

              {/* Name */}
              <div className={`text-center text-xs sm:text-sm font-bold px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg w-full ${owned ? 'text-white bg-black/20 backdrop-blur-sm' : 'text-gray-400'}`}>
                {owned ? item.name : '???'}
              </div>

              {/* Equip Button - Responsive text */}
              {owned && onEquipCursor && onUnequipCursor && (
                <button
                  onClick={() => isEquipped ? onUnequipCursor() : onEquipCursor(item.id)}
                  className={`mt-1 sm:mt-2 w-full px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isEquipped
                      ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                      : 'bg-white/90 text-gray-800 hover:bg-white'
                  }`}
                >
                  {/* Responsive button text */}
                  <span className="hidden sm:inline">
                    {isEquipped ? '✓ Equipped' : 'Equip Cursor'}
                  </span>
                  <span className="sm:hidden">
                    {isEquipped ? '✓ On' : 'Equip'}
                  </span>
                </button>
              )}

              {/* Rarity Badge */}
              {owned && (
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                  <div className="px-1 sm:px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 shadow-lg">
                    <span className="hidden sm:inline">{item.rarity.toUpperCase()}</span>
                    <span className="sm:hidden">{item.rarity[0].toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secret Item - Responsive */}
      {secretItem ? (
        <div className="mt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-lg sm:text-xl">✨</span>
              <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse">
                Ultra Rare Secret
              </h3>
              <span className="text-lg sm:text-xl">✨</span>
            </div>

            <div className="flex justify-center">
              <div
                className={`
                  relative rounded-xl p-3 sm:p-4
                  flex flex-col items-center justify-between
                  transition-all duration-500
                  ${isOwned(secretItem.id)
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:scale-105'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }
                  ${equippedCursorId === secretItem.id ? 'ring-2 sm:ring-4 ring-yellow-400 ring-offset-1 sm:ring-offset-2' : ''}
                `}
                style={{ width: '160px', height: '200px' }} // Smaller on mobile
              >
                {/* Animated border */}
                {isOwned(secretItem.id) && (
                  <>
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 opacity-50 blur-sm animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    
                    {/* Corner sparkles */}
                    <span className="absolute top-1 sm:top-2 left-1 sm:left-2 text-sm sm:text-lg animate-pulse">✨</span>
                    <span className="absolute top-1 sm:top-2 right-1 sm:right-2 text-sm sm:text-lg animate-pulse" style={{ animationDelay: '0.5s' }}>✨</span>
                    <span className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-sm sm:text-lg animate-pulse" style={{ animationDelay: '1s' }}>✨</span>
                    <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 text-sm sm:text-lg animate-pulse" style={{ animationDelay: '1.5s' }}>✨</span>
                  </>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
                  <div className={`flex items-center justify-center ${isOwned(secretItem.id) ? '' : 'opacity-30'}`} style={{ height: '80px' }}>
                    {isOwned(secretItem.id) ? (
                      <img 
                        src={secretItem.image} 
                        alt={secretItem.name} 
                        className="max-h-full object-contain drop-shadow-2xl"
                        style={{ animation: 'float 3s ease-in-out infinite' }}
                      />
                    ) : (
                      <div className="text-4xl sm:text-5xl text-gray-400">🔒</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className={`text-center text-xs sm:text-sm font-bold px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg w-full mb-1 ${isOwned(secretItem.id) ? 'text-white bg-black/20 backdrop-blur-sm' : 'text-gray-400 bg-white/50'}`}>
                      {isOwned(secretItem.id) ? secretItem.name : '???'}
                    </div>

                    {/* Equip Button for Secret Item - Responsive text */}
                    {isOwned(secretItem.id) && onEquipCursor && onUnequipCursor && (
                      <button
                        onClick={() => 
                          equippedCursorId === secretItem.id 
                            ? onUnequipCursor() 
                            : onEquipCursor(secretItem.id)
                        }
                        className={`mt-1 sm:mt-2 w-full px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                          equippedCursorId === secretItem.id
                            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                            : 'bg-white/90 text-gray-800 hover:bg-white'
                        }`}
                      >
                        {/* Responsive button text */}
                        <span className="hidden sm:inline">
                          {equippedCursorId === secretItem.id ? '✓ Equipped' : 'Equip Cursor'}
                        </span>
                        <span className="sm:hidden">
                          {equippedCursorId === secretItem.id ? '✓ On' : 'Equip'}
                        </span>
                      </button>
                    )}

                    <div className={`px-1 sm:px-2 py-0.5 rounded-full text-xs font-bold text-center mt-1 ${
                      isOwned(secretItem.id) 
                        ? 'bg-white/30 backdrop-blur-md text-white font-black' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isOwned(secretItem.id) ? 'SECRET' : 'LOCKED'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isOwned(secretItem.id) && (
              <p className="text-center mt-3 text-xs sm:text-sm text-gray-500 italic">
                A legendary mystery awaits...
              </p>
            )}
          </div>
        </div>
      ) : (
        // Placeholder if secret item doesn't exist yet
        <div className="mt-8 relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg sm:text-xl">✨</span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-400">
              Ultra Rare Secret
            </h3>
            <span className="text-lg sm:text-xl">✨</span>
          </div>
          <div className="flex justify-center">
            <div className="relative rounded-xl p-3 sm:p-4 flex flex-col items-center justify-between bg-gradient-to-br from-gray-100 to-gray-200" style={{ width: '160px', height: '160px' }}>
              <div className="flex items-center justify-center opacity-30" style={{ height: '80px' }}>
                <div className="text-4xl sm:text-5xl text-gray-400">🔒</div>
              </div>
              <div className="w-full">
                <div className="text-center text-xs sm:text-sm font-bold px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg w-full mb-1 text-gray-400 bg-white/50">
                  ???
                </div>
                <div className="px-1 sm:px-2 py-0.5 bg-gray-300 rounded-full text-xs font-bold text-gray-600 text-center">
                  LOCKED
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-3 text-xs sm:text-sm text-gray-500 italic">
            A legendary mystery awaits...
          </p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}} />
    </div>
  );
};

export default CollectionGrid;