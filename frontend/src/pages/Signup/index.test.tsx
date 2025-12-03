import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import SignupPage from './index';
import { apiService } from '../../api-contexts/user-context';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the apiService
jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    signup: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const renderSignupPage = () => {
    return render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );
  };

  // Helper functions to get inputs by placeholder
  const getEmailInput = () => screen.getByPlaceholderText(/enter your email or phone number/i);
  const getDisplayNameInput = () => screen.getByPlaceholderText(/enter your display name/i);
  const getPasswordInputs = () => screen.getAllByPlaceholderText(/enter your password/i);
  const getPasswordInput = () => getPasswordInputs()[0];
  const getConfirmPasswordInput = () => getPasswordInputs()[1];

  describe('Initial Render', () => {
    it('renders all form fields', () => {
      renderSignupPage();
      
      expect(getEmailInput()).toBeInTheDocument();
      expect(getDisplayNameInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('renders the logo image', () => {
      renderSignupPage();
      const logo = screen.getByAltText('Achievo');
      expect(logo).toBeInTheDocument();
    });

    it('renders the login link', () => {
      renderSignupPage();
      expect(screen.getByText(/already had an account\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting empty form', async () => {
      renderSignupPage();
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText('Required');
        expect(errorMessages).toHaveLength(4); // email, displayName, password, confirmPassword
      });

      expect(screen.getByText(/you must agree to the terms and conditions/i)).toBeInTheDocument();
    });

    it('clears email error when user types', () => {
      renderSignupPage();
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      const emailInput = getEmailInput();
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(screen.queryAllByText('Required')).toHaveLength(3);
    });

    it('clears display name error when user types', () => {
      renderSignupPage();
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      const displayNameInput = getDisplayNameInput();
      fireEvent.change(displayNameInput, { target: { value: 'John Doe' } });

      expect(screen.queryAllByText('Required')).toHaveLength(3);
    });

    it('clears password error when user types', () => {
      renderSignupPage();
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      const passwordInput = getPasswordInput();
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

      expect(screen.queryAllByText('Required')).toHaveLength(3);
    });

    it('clears confirm password error when user types', () => {
      renderSignupPage();
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      const confirmPasswordInput = getConfirmPasswordInput();
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

      expect(screen.queryAllByText('Required')).toHaveLength(3);
    });

    it('clears terms error when user checks the checkbox', () => {
      renderSignupPage();
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/you must agree to the terms and conditions/i)).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(screen.queryByText(/you must agree to the terms and conditions/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Requirements', () => {
    it('displays password requirements when user types', () => {
      renderSignupPage();
      
      const passwordInput = getPasswordInput();
      fireEvent.change(passwordInput, { target: { value: 'a' } });

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
    });

    it('updates requirements as password meets criteria', () => {
      renderSignupPage();
      
      const passwordInput = getPasswordInput();
      
      // Meets minLength
      fireEvent.change(passwordInput, { target: { value: 'abcdefgh' } });
      expect(screen.getByText(/✓ at least 8 characters/i)).toBeInTheDocument();

      // Meets uppercase
      fireEvent.change(passwordInput, { target: { value: 'Abcdefgh' } });
      expect(screen.getByText(/✓ at least one uppercase letter/i)).toBeInTheDocument();

      // Meets number
      fireEvent.change(passwordInput, { target: { value: 'Abcdefgh1' } });
      expect(screen.getByText(/✓ at least one number/i)).toBeInTheDocument();

      // Meets special character
      fireEvent.change(passwordInput, { target: { value: 'Abcdefgh1!' } });
      expect(screen.getByText(/✓ at least one special character/i)).toBeInTheDocument();
    });

    it('shows error when password does not meet requirements', async () => {
      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'weak' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'weak' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password does not meet all requirements/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Matching', () => {
    it('shows error when passwords do not match', async () => {
      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'DifferentPass123!' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Signup', () => {
    it('successfully signs up user and navigates to onboarding', async () => {
      const mockUser = { id: '123', email: 'test@example.com', displayName: 'John Doe' };
      (apiService.signup as jest.Mock).mockResolvedValue({ user: mockUser });

      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.signup).toHaveBeenCalledWith('test@example.com', 'Password123!', 'John Doe');
      });

      expect(localStorageMock.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });

    it('shows loading state during signup', async () => {
      (apiService.signup as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: {} }), 100))
      );

      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/signing up\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/signing up\.\.\./i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when signup fails', async () => {
      (apiService.signup as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('displays default error message for network errors', async () => {
      (apiService.signup as jest.Mock).mockRejectedValue({});

      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error\. please check your connection and try again\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to login page when login link is clicked', () => {
      renderSignupPage();
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Form Interactions', () => {
    it('updates email field value', () => {
      renderSignupPage();
      
      const emailInput = getEmailInput() as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      expect(emailInput.value).toBe('newemail@example.com');
    });

    it('updates display name field value', () => {
      renderSignupPage();
      
      const displayNameInput = getDisplayNameInput() as HTMLInputElement;
      fireEvent.change(displayNameInput, { target: { value: 'Jane Smith' } });

      expect(displayNameInput.value).toBe('Jane Smith');
    });

    it('updates password field value', () => {
      renderSignupPage();
      
      const passwordInput = getPasswordInput() as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });

      expect(passwordInput.value).toBe('NewPassword123!');
    });

    it('updates confirm password field value', () => {
      renderSignupPage();
      
      const confirmPasswordInput = getConfirmPasswordInput() as HTMLInputElement;
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });

      expect(confirmPasswordInput.value).toBe('NewPassword123!');
    });

    it('toggles terms checkbox', () => {
      renderSignupPage();
      
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Field Disabling', () => {
    it('disables all fields during loading', async () => {
      (apiService.signup as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: {} }), 100))
      );

      renderSignupPage();
      
      fireEvent.change(getEmailInput(), { target: { value: 'test@example.com' } });
      fireEvent.change(getDisplayNameInput(), { target: { value: 'John Doe' } });
      fireEvent.change(getPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(getEmailInput()).toBeDisabled();
        expect(getDisplayNameInput()).toBeDisabled();
        expect(getPasswordInput()).toBeDisabled();
        expect(getConfirmPasswordInput()).toBeDisabled();
        expect(screen.getByRole('checkbox')).toBeDisabled();
      });
    });
  });
});