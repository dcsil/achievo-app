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
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-12">
      {/* Large Image Section */}
      <div className="relative w-full bg-gradient-to-b from-green-50 to-white px-8 pt-8 pb-6">
        {!isOpening && (
          <div className="transition-all duration-500">
            {seriesImage ? (
              <img 
                src={seriesImage} 
                alt={seriesName}
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-6xl font-bold shadow-2xl">
                ?
              </div>
            )}
          </div>
        )}
        
        {/* Opening animation - show gift box only */}
        {isOpening && (
          <div className="flex items-center justify-center animate-fade-in" style={{ minHeight: '400px' }}>
            <div className="text-9xl animate-bounce">
              🎁
            </div>
          </div>
        )}
      </div>

      {/* Bottom section with title/description on left, button on right */}
      <div className="flex items-end justify-between gap-6 px-8 pb-8 pt-4">
        <div className="flex-1 text-left">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{seriesName}</h2>
          <p className="text-gray-600 text-lg">{description}</p>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={onPurchase}
            disabled={!canAfford || isOpening}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform shadow-lg whitespace-nowrap ${
              canAfford && !isOpening
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:scale-105 hover:shadow-2xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isOpening ? (
              <span className="flex items-center justify-center gap-2">
                <span>🎁</span>
                Opening...
              </span>
            ) : (
              <span>Open Blindbox ({cost} 🪙)</span>
            )}
          </button>
          
          {!canAfford && (
            <p className="text-red-500 text-xs font-medium mt-2 text-right">
              Need {cost - userPoints} more points!
            </p>
          )}
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