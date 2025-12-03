import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InterestsStep from './InterestsStep';

describe('InterestsStep', () => {
  const setup = () => {
    const onNext = jest.fn();
    const onBack = jest.fn();
    const onSkip = jest.fn();
    render(<InterestsStep onNext={onNext} onBack={onBack} onSkip={onSkip} />);
    return { onNext, onSkip };
  };

  it('renders headings and Continue is disabled initially', () => {
    setup();
    expect(screen.getByText("Let's understand your interests")).toBeInTheDocument();
    expect(screen.getByText(/Mental health is crucial/i)).toBeInTheDocument();
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
    // Activities visible
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /read/i })).toBeInTheDocument();
  });

  it('selecting activities enables Continue and toggles styles', () => {
    setup();
    const runBtn = screen.getByRole('button', { name: /run/i });
    // Select "Run"
    fireEvent.click(runBtn);
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();

    // Toggle off then on again
    fireEvent.click(runBtn);
    expect(continueBtn).toBeDisabled();
    fireEvent.click(runBtn);
    expect(continueBtn).not.toBeDisabled();
  });

  it('clicking Continue triggers onNext', () => {
    const { onNext } = setup();
    fireEvent.click(screen.getByRole('button', { name: /run/i }));
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('Skip triggers onSkip', () => {
    const { onSkip } = setup();
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
