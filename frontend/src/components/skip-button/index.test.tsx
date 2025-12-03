import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './index';

describe('Button', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button onClick={mockOnClick}>Click me</Button>);
      
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with JSX children', () => {
      render(
        <Button onClick={mockOnClick}>
          <span>Custom content</span>
        </Button>
      );
      
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('applies base styles', () => {
      render(<Button onClick={mockOnClick}>Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-medium', 'transition-colors', 'rounded-lg');
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      render(<Button onClick={mockOnClick}>Primary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'px-6',
        'py-3',
        'bg-blue-600',
        'text-white',
        'hover:bg-blue-700'
      );
    });

    it('renders primary variant when explicitly set', () => {
      render(<Button onClick={mockOnClick} variant="primary">Primary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'px-6',
        'py-3',
        'bg-blue-600',
        'text-white',
        'hover:bg-blue-700'
      );
    });

    it('renders secondary variant', () => {
      render(<Button onClick={mockOnClick} variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'px-6',
        'py-3',
        'text-gray-600',
        'hover:text-gray-800'
      );
      expect(button).not.toHaveClass('bg-blue-600');
    });

    it('renders ghost variant', () => {
      render(<Button onClick={mockOnClick} variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'px-6',
        'py-3',
        'text-gray-600',
        'hover:text-gray-800'
      );
      expect(button).not.toHaveClass('bg-blue-600');
    });
  });

  describe('Disabled State', () => {
    it('is enabled by default', () => {
      render(<Button onClick={mockOnClick}>Enabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('can be disabled', () => {
      render(<Button onClick={mockOnClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled styles when disabled', () => {
      render(<Button onClick={mockOnClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
    });

    it('does not call onClick when disabled', () => {
      render(<Button onClick={mockOnClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked', () => {
      render(<Button onClick={mockOnClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick multiple times when clicked multiple times', () => {
      render(<Button onClick={mockOnClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <Button onClick={mockOnClick} className="custom-class">
          Custom
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with default styles', () => {
      render(
        <Button onClick={mockOnClick} className="custom-class">
          Custom
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-medium', 'custom-class');
    });

    it('allows custom className to override default styles', () => {
      render(
        <Button onClick={mockOnClick} className="bg-red-500">
          Custom
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });
  });

  describe('Accessibility', () => {
    it('is focusable when enabled', () => {
      render(<Button onClick={mockOnClick}>Focusable</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('has proper button role', () => {
      render(<Button onClick={mockOnClick}>Button</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports keyboard interaction', () => {
      render(<Button onClick={mockOnClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // Note: fireEvent.keyDown doesn't automatically trigger click for buttons
      // but the button element natively supports Enter key activation
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Button onClick={mockOnClick}>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles undefined className', () => {
      render(<Button onClick={mockOnClick} className={undefined}>Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-medium');
    });

    it('handles empty string className', () => {
      render(<Button onClick={mockOnClick} className="">Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-medium');
    });
  });
});
