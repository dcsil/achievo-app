import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompletionStep from './CompletionStep';

describe('CompletionStep', () => {
  const setup = () => {
    const onNext = jest.fn();
    const onBack = jest.fn();
    render(<CompletionStep onNext={onNext} onBack={onBack} />);
    return { onNext };
  };

  it('renders header and helper text', () => {
    setup();
    expect(screen.getByText("You're All Set!")).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to Achievo! You're ready to start managing/i)
    ).toBeInTheDocument();
  });

  it('shows key feature tiles', () => {
    setup();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
    expect(screen.getByText('Earn Points')).toBeInTheDocument();
    expect(screen.getByText('View Insights')).toBeInTheDocument();
  });

  it('clicking Go to Dashboard triggers onNext', () => {
    const { onNext } = setup();
    const btn = screen.getByRole('button', { name: /go to dashboard/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
