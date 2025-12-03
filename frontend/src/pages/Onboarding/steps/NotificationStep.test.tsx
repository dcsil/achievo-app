import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationStep from './NotificationStep';

describe('NotificationStep', () => {
  const setup = () => {
    const onNext = jest.fn();
    const onBack = jest.fn();
    const onSkip = jest.fn();
    render(<NotificationStep onNext={onNext} onBack={onBack} onSkip={onSkip} />);
    return { onNext };
  };

  it('renders heading and helper text', () => {
    setup();
    expect(screen.getByText('Stay on Track')).toBeInTheDocument();
    expect(
      screen.getByText(/Get gentle reminders to take breaks and stay productive/i)
    ).toBeInTheDocument();
  });

  it('shows feature blocks', () => {
    setup();
    expect(screen.getByText('🔔 Break Reminders')).toBeInTheDocument();
    expect(screen.getByText('🎯 Goal Updates')).toBeInTheDocument();
    expect(
      screen.getByText(/We'll notify you when it's time for a healthy break/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Celebrate your achievements and track progress/i)
    ).toBeInTheDocument();
  });

  it('Continue button triggers onNext', () => {
    const { onNext } = setup();
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeInTheDocument();
    fireEvent.click(continueBtn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
