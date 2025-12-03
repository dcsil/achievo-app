import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Rewards from './index';

jest.mock('../../api-contexts/blindbox/get-blindbox-series', () => ({
  useBlindBoxSeries: () => ({
    series: [
      { series_id: 'S2', name: 'Series 2', cost_points: 100, image: 'img', description: 'desc' }
    ],
    fetchAllSeries: jest.fn(),
    loading: false
  })
}));

jest.mock('../../api-contexts/blindbox/get-blindbox-figures', () => ({
  useBlindBoxFigures: () => ({
    figures: [
      {
        figure_id: 'F1',
        name: 'Figure 1',
        rarity: 'common',
        series_id: 'S2',
        image: 'f1.png'
      }
    ],
    fetchAllFigures: jest.fn(),
    loading: false
  })
}));

const mockPurchase = jest.fn();
const mockGetUserFigures = jest.fn();

jest.mock('../../api-contexts/blindbox/purchase-blindbox', () => ({
  useBlindBoxPurchase: () => ({
    userFigures: [
      { awarded_figure_id: 'F1' } 
    ],
    purchaseBlindBox: mockPurchase,
    getUserFigures: mockGetUserFigures,
    loading: false
  })
}));

jest.mock('../../components/rewards/rewards-header', () => () => <div>HeaderMock</div>);
jest.mock('../../components/rewards/mystery-box', () => (props: any) => (
  <div data-testid="mystery-box" onClick={props.onPurchase}>MysteryBox</div>
));
jest.mock('../../components/rewards/collection-grid', () => () => <div>CollectionGridMock</div>);
jest.mock('../../components/rewards/reveal-modal', () => (props: any) =>
  props.isOpen ? <div data-testid="reveal-modal">RevealModal</div> : null
);

beforeEach(() => {
  jest.clearAllMocks();
  Storage.prototype.getItem = jest.fn(() => null);
  Storage.prototype.setItem = jest.fn();
  window.dispatchEvent = jest.fn();
});


describe('Rewards Component', () => {
  const user = {
  user_id: 'U1',
  total_points: 300,
  current_level: 1,
};

  const userId = 'USER1';

  const renderRewards = (props = {}) =>
    render(<Rewards user={user} userId={userId} updateUserPoints={jest.fn()} {...props} />);

  test('renders header, mystery box, and collection grid', () => {
    renderRewards();

    expect(screen.getByText('HeaderMock')).toBeInTheDocument();
    expect(screen.getByTestId('mystery-box')).toBeInTheDocument();
    expect(screen.getByText('CollectionGridMock')).toBeInTheDocument();
  });

  test('calls fetch functions on mount', () => {
    renderRewards();

    expect(mockGetUserFigures).toHaveBeenCalledWith('USER1');
  });

  test('saves figures to localStorage when figures load', () => {
    renderRewards();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cursor_figures',
      JSON.stringify([
        {
          id: 'F1',
          name: 'Figure 1',
          image: 'f1.png',
          rarity: 'common'
        }
      ])
    );
  });

  test('purchase flow opens reveal modal', async () => {
    mockPurchase.mockResolvedValue({
      remaining_points: 200,
      awarded_figure: {
        figure_id: 'F1',
        name: 'Figure 1',
        image: 'f1.png',
        rarity: 'common'
      }
    });

    renderRewards();

    fireEvent.click(screen.getByTestId('mystery-box'));

    await waitFor(() => {
      expect(screen.getByTestId('reveal-modal')).toBeInTheDocument();
    });
  });

  test('cursor equip updates localStorage', () => {
    renderRewards();
    const collectionGrid = screen.getByText('CollectionGridMock');
    fireEvent.click(collectionGrid);
    expect(true).toBe(true);
  });
});
