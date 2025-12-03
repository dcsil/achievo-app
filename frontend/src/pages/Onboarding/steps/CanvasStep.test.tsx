import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CanvasStep from './CanvasStep';

describe('CanvasStep', () => {
  const setup = () => {
    const onNext = jest.fn();
    const onBack = jest.fn(); // not used in this step, but included for completeness
    const onSkip = jest.fn();
    render(<CanvasStep onNext={onNext} onBack={onBack} onSkip={onSkip} />);
    return { onNext, onSkip };
  };

  it('renders initial state with token input and disabled connect button', () => {
    setup();
    expect(screen.getByText('Canvas Integration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your Canvas token')).toBeInTheDocument();
    const connectBtn = screen.getByRole('button', { name: /connect canvas/i });
    expect(connectBtn).toBeDisabled();
    // Skip is visible initially
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('enables connect after entering token and shows courses list', () => {
    setup();
    const input = screen.getByPlaceholderText('Enter your Canvas token');
    fireEvent.change(input, { target: { value: 'token-123' } });

    const connectBtn = screen.getByRole('button', { name: /connect canvas/i });
    expect(connectBtn).not.toBeDisabled();

    fireEvent.click(connectBtn);

    // Courses appear
    expect(screen.getByText(/detected the following courses/i)).toBeInTheDocument();
    expect(screen.getByText('The Business of Software')).toBeInTheDocument();
    expect(screen.getByText('Capstone Design Project')).toBeInTheDocument();
    expect(screen.getByText('Ethics and Data')).toBeInTheDocument();
    expect(screen.getByText('Theory of Statistical Practice')).toBeInTheDocument();
  });

  it('toggles course selection and confirms courses calls onNext', () => {
    const { onNext } = setup();
    fireEvent.change(screen.getByPlaceholderText('Enter your Canvas token'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /connect canvas/i }));

    // All courses are selected by default; toggle one off and back on
    const courseCard = screen.getByText('The Business of Software').closest('div')!;
    fireEvent.click(courseCard); // deselect
    fireEvent.click(courseCard); // reselect

    fireEvent.click(screen.getByRole('button', { name: /confirm courses/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('skip works in both token and courses states', () => {
    const { onSkip } = setup();
    // Skip in initial state
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);

    // Move to courses state
    fireEvent.change(screen.getByPlaceholderText('Enter your Canvas token'), { target: { value: 'xyz' } });
    fireEvent.click(screen.getByRole('button', { name: /connect canvas/i }));

    // Skip again
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(2);
  });
});