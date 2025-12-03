import '@testing-library/jest-dom';

const mockRender = jest.fn();
jest.mock('react-dom/client', () => {
  return {
    createRoot: () => ({
      render: mockRender,
    }),
  };
});

document.body.innerHTML = `<div id="root"></div>`;

describe('index.tsx', () => {
  it('renders App without crashing', () => {
    require('./index');
    expect(mockRender).toHaveBeenCalledTimes(1);
  });
});
