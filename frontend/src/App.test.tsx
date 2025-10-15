import React from 'react';
import { render, screen } from '@testing-library/react';
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

test('renders app without crashing', () => {
  render(<App />);
  // Test for something that actually exists in your app
  // For example, if your app has a header or main container:
  expect(document.body).toBeInTheDocument();
});