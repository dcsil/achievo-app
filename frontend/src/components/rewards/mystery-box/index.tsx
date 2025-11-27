import React from 'react';

interface MysteryBoxProps {
  seriesName: string;
  description: string;
  cost: number;
  canAfford: boolean;
  isOpening: boolean;
  userPoints: number;
  seriesImage?: string;
  onPurchase: () => void;
}

const MysteryBox: React.FC<MysteryBoxProps> = ({ 
  seriesName,
  description,
  cost, 
  canAfford, 
  isOpening, 
  userPoints,
  seriesImage,
  onPurchase 
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-12 max-w-4xl mx-auto">
      {/* Large Image Section */}
      <div className="relative w-full bg-gradient-to-b from-green-50 to-white px-4 sm:px-8 pt-8 pb-6">
        {!isOpening && (
          <div className="transition-all duration-500">
            {seriesImage ? (
              <img 
                src={seriesImage} 
                alt={seriesName}
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-full h-64 sm:h-96 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-4xl sm:text-6xl font-bold shadow-2xl">
                ?
              </div>
            )}
          </div>
        )}
        
        {/* Opening animation - show gift box only */}
        {isOpening && (
          <div className="flex items-center justify-center animate-fade-in" style={{ minHeight: '300px' }}>
            <div className="text-6xl sm:text-9xl animate-bounce">
              🎁
            </div>
          </div>
        )}
      </div>

      {/* Bottom section - responsive layout */}
      <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-4">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
          {/* Text content */}
          <div className="flex-1 text-left">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">{seriesName}</h2>
            <p className="text-gray-600 text-base sm:text-lg">{description}</p>
          </div>
          
          {/* Button section */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={onPurchase}
              disabled={!canAfford || isOpening}
              className={`w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all transform shadow-lg ${
                canAfford && !isOpening
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:scale-105 hover:shadow-2xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isOpening ? (
                <span className="flex items-center justify-center gap-2">
                  <span>🎁</span>
                  <span className="hidden sm:inline">Opening...</span>
                  <span className="sm:hidden">Opening</span>
                </span>
              ) : (
                <span className="block">
                  <span className="hidden sm:inline">Open Blindbox ({cost} 🪙)</span>
                  <span className="sm:hidden">Open ({cost} 🪙)</span>
                </span>
              )}
            </button>
            
            {!canAfford && (
              <p className="text-red-500 text-xs font-medium mt-2 text-center sm:text-right">
                Need {cost - userPoints} more points!
              </p>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}} />
    </div>
  );
};

export default MysteryBox;