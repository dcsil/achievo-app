import React from 'react';

interface MysteryBoxProps {
  cost: number;
  canAfford: boolean;
  isOpening: boolean;
  userPoints: number;
  onPurchase: () => void;
}

const MysteryBox: React.FC<MysteryBoxProps> = ({ 
  cost, 
  canAfford, 
  isOpening, 
  userPoints,
  onPurchase 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Series 1 Blindbox</h2>
        <p className="text-gray-600 mb-4">Collect all 12 unique items!</p>
        
        <div className="relative inline-block mb-6">
          <div className={`text-8xl transition-transform duration-300 ${isOpening ? 'animate-bounce' : ''}`}>
            📦
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
              <>Open Blindbox - {cost} 🪙</>
            )}
          </button>
        </div>

        {!canAfford && (
          <p className="text-red-500 text-sm">
            Need {cost - userPoints} more coins!
          </p>
        )}
      </div>
    </div>
  );
};

export default MysteryBox;