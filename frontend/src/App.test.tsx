import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the Home component to keep the test simple
jest.mock('./pages/Home', () => {
  return function MockHome() {
    return <div data-testid="home">Home Component</div>;
  };
});

test('renders App component', () => {
  const { container } = render(<App />);
  
  // Check that the App div exists
  expect(container.querySelector('.App')).toBeInTheDocument();
});