import React from 'react';
import { CollectibleItem } from '../collection-item';

interface RevealModalProps {
  isOpen: boolean;
  item: CollectibleItem | null;
  isDuplicate: boolean;
  onClose: () => void;
}

const RevealModal: React.FC<RevealModalProps> = ({ isOpen, item, isDuplicate, onClose }) => {
  if (!isOpen || !item) return null;

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div 
          className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 text-center aspect-square flex flex-col justify-center"
          style={{ animation: 'scaleIn 0.4s ease-out' }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">You got!</h3>
          
          <div className={`text-9xl my-6 animate-bounce`}>
            {item.emoji}
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-4">
            {item.name}
          </h4>
          
          <div className="mb-6">
            <span className={`inline-block px-4 py-2 rounded-full font-semibold bg-gradient-to-r ${getRarityGradient(item.rarity)} text-white`}>
              {item.rarity.toUpperCase()}
            </span>
          </div>

          {isDuplicate && (
            <p className="text-gray-500 text-sm mb-6">Duplicate! Already in collection</p>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Awesome!
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </>
  );
};

export default RevealModal;