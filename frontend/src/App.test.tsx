import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Test for something that actually exists in your app
  // For example, if your app has a header or main container:
  expect(document.body).toBeInTheDocument();
});