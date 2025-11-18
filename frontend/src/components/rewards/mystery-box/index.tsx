import React from 'react';

interface MysteryBoxProps {
  seriesName: string;
  description: string;
  cost: number;
  canAfford: boolean;
  isOpening: boolean;
  userPoints: number;
  seriesImage?: string; // Add series cover image
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
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{seriesName}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="relative inline-block mb-6">
          <div className={`transition-transform duration-300 ${isOpening ? 'animate-bounce' : ''}`}>
            {seriesImage ? (
              <img 
                src={seriesImage} 
                alt={seriesName}
                className="w-32 h-32 object-contain mx-auto"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold">
                ?
              </div>
            )}
          </div>
          {isOpening && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-spin">✨</div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <button
            onClick={onPurchase}
            disabled={!canAfford || isOpening}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
              canAfford && !isOpening
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:scale-105 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isOpening ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Opening...
              </span>
            ) : (
              <>Open Blindbox - {cost} Points</>
            )}
          </button>
        </div>

        {!canAfford && (
          <p className="text-red-500 text-sm">
            Need {cost - userPoints} more points!
          </p>
        )}
      </div>
    </div>
  );
};

export default MysteryBox;