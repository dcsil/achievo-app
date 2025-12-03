import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import RewardsHeader from './index';
import { User } from '../../../api-contexts/user-context';

const mockUser: User = {
  user_id: 'test-user-123',
  canvas_username: 'TestUser',
  total_points: 1500,
  current_level: 5,
  profile_picture: 'https://example.com/profile.jpg',
};

describe('RewardsHeader Component', () => {
  describe('Rendering', () => {
    it('renders rewards shop title', () => {
      render(<RewardsHeader user={mockUser} />);

      expect(screen.getByText('🎁 Rewards Shop')).toBeInTheDocument();
    });

    it('renders gift emoji in title', () => {
      render(<RewardsHeader user={mockUser} />);

      expect(screen.getByText(/🎁/)).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<RewardsHeader user={mockUser} />);

      expect(screen.getByText('Rewards for your hard-earned completion of assignments!')).toBeInTheDocument();
    });

    it('renders with null user', () => {
      render(<RewardsHeader user={null} />);

      expect(screen.getByText('🎁 Rewards Shop')).toBeInTheDocument();
      expect(screen.getByText('Rewards for your hard-earned completion of assignments!')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('container has correct classes', () => {
      const { container } = render(<RewardsHeader user={mockUser} />);

      const headerContainer = container.firstChild;
      expect(headerContainer).toHaveClass('mb-6', 'text-left');
    });

    it('title has correct styling', () => {
      render(<RewardsHeader user={mockUser} />);

      const title = screen.getByText('🎁 Rewards Shop');
      expect(title).toHaveClass('text-3xl', 'font-bold', 'text-gray-800', 'mb-2');
    });

    it('description has correct styling', () => {
      render(<RewardsHeader user={mockUser} />);

      const description = screen.getByText('Rewards for your hard-earned completion of assignments!');
      expect(description).toHaveClass('text-gray-600');
    });
  });

  describe('Structure', () => {
    it('renders h1 element for title', () => {
      render(<RewardsHeader user={mockUser} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('🎁 Rewards Shop');
    });

    it('renders p element for description', () => {
      const { container } = render(<RewardsHeader user={mockUser} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveTextContent('Rewards for your hard-earned completion of assignments!');
    });

    it('title comes before description', () => {
      const { container } = render(<RewardsHeader user={mockUser} />);

      const children = container.firstChild?.childNodes;
      expect(children?.[0]).toHaveTextContent('🎁 Rewards Shop');
      expect(children?.[1]).toHaveTextContent('Rewards for your hard-earned completion of assignments!');
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly with user with zero points', () => {
      const zeroPointsUser = { ...mockUser, total_points: 0 };
      render(<RewardsHeader user={zeroPointsUser} />);

      expect(screen.getByText('🎁 Rewards Shop')).toBeInTheDocument();
    });

    it('renders correctly with user with empty username', () => {
      const emptyUsernameUser = { ...mockUser, canvas_username: '' };
      render(<RewardsHeader user={emptyUsernameUser} />);

      expect(screen.getByText('🎁 Rewards Shop')).toBeInTheDocument();
    });

    it('renders correctly with user with no profile picture', () => {
      const noPictureUser = { ...mockUser, profile_picture: '' };
      render(<RewardsHeader user={noPictureUser} />);

      expect(screen.getByText('🎁 Rewards Shop')).toBeInTheDocument();
    });
  });
});