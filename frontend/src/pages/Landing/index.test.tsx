import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import Landing from './index';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('Landing Component', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the landing page with all elements', () => {
    render(<Landing />);

    // Check for image
    const image = screen.getByAltText('Achievo');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('clap'));

    // Check for tagline text
    expect(screen.getByText(/Your cheerful companion for a more/i)).toBeInTheDocument();
    expect(screen.getByText('productive')).toBeInTheDocument();
    expect(screen.getByText('happier')).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();

    // Check for account prompt text
    expect(screen.getByText(/have an account\?/i)).toBeInTheDocument();
  });

  it('navigates to /signup when "Get Started" button is clicked', () => {
    render(<Landing />);

    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    fireEvent.click(getStartedButton);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('navigates to /login when "Login" button is clicked', () => {
    render(<Landing />);

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('renders with onLogin prop without errors', () => {
    const mockOnLogin = jest.fn();
    
    render(<Landing onLogin={mockOnLogin} />);

    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    const { container } = render(<Landing />);

    // Check main container classes
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-rose-100');

    // Check Get Started button classes
    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    expect(getStartedButton).toHaveClass('bg-gradient-to-br', 'from-orange-400', 'to-yellow-500');

    // Check login button classes
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toHaveClass('text-amber-500', 'font-medium', 'hover:underline');
  });

  it('renders image with correct attributes', () => {
    render(<Landing />);

    const image = screen.getByAltText('Achievo') as HTMLImageElement;
    expect(image).toHaveClass('mx-auto', 'w-40', 'h-40', 'object-contain');
  });

  it('renders with correct button types', () => {
    render(<Landing />);

    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    expect(getStartedButton).toHaveAttribute('type', 'button');
  });
});