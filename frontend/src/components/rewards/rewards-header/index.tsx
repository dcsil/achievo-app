import React from 'react';
import { User } from '../../../api-contexts/user-context';

interface RewardsHeaderProps {
  user: User | null;
}

const RewardsHeader: React.FC<RewardsHeaderProps> = ({ user }) => {
  return (
    <div className="mb-6 text-left">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">🎁 Rewards Shop</h1>
      <p className="text-gray-600">Rewards for your hard-earned completion of assignments!</p>
    </div>
  );
};

export default RewardsHeader;