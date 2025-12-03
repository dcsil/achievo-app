import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LoginPage from './index';
import { setUserId, isExtensionEnvironment } from '../../utils/extensionUtils';
import { apiService } from '../../api-contexts/user-context';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../utils/extensionUtils', () => ({
  setUserId: jest.fn(),
  isExtensionEnvironment: jest.fn(),
}));

jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    login: jest.fn(),
  },
}));

// Mock the image import
jest.mock('../../assets/achievo-clap-transparent.png', () => 'test-clap-image.png');

const mockNavigate = jest.fn();
const mockSetUserId = setUserId as jest.MockedFunction<typeof setUserId>;
const mockIsExtensionEnvironment = isExtensionEnvironment as jest.MockedFunction<typeof isExtensionEnvironment>;
const mockApiLogin = apiService.login as jest.MockedFunction<typeof apiService.login>;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    const { useNavigate } = require('react-router-dom');
    useNavigate.mockReturnValue(mockNavigate);
    mockIsExtensionEnvironment.mockReturnValue(false);
    console.error = jest.fn();
    console.log = jest.fn();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the login form with all elements', () => {
      renderLoginPage();

      expect(screen.getByAltText('Achievo')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render the logo image with correct src', () => {
      renderLoginPage();
      const img = screen.getByAltText('Achievo');
      expect(img).toHaveAttribute('src', 'test-clap-image.png');
    });
  });

  describe('Form Input Handling', () => {
    it('should update email state when typing', () => {
      renderLoginPage();
      const emailInput = screen.getByPlaceholderText('Enter your email');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password state when typing', () => {
      renderLoginPage();
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput).toHaveValue('password123');
    });

    it('should clear email error when user types after error', () => {
      renderLoginPage();
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      // Submit empty form to trigger error
      fireEvent.click(submitButton);
      expect(screen.getAllByText('Required')).toHaveLength(2);

      // Type in email field
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      // Email error should be cleared
      const errors = screen.queryAllByText('Required');
      expect(errors).toHaveLength(1); // Only password error remains
    });

    it('should clear password error when user types after error', () => {
      renderLoginPage();
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      // Submit empty form to trigger error
      fireEvent.click(submitButton);
      expect(screen.getAllByText('Required')).toHaveLength(2);

      // Type in password field
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      // Password error should be cleared
      const errors = screen.queryAllByText('Required');
      expect(errors).toHaveLength(1); // Only email error remains
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when show/hide button is clicked', () => {
      renderLoginPage();
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const toggleButton = screen.getByRole('button', { name: /show/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty on submit', () => {
      renderLoginPage();
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      const errors = screen.getAllByText('Required');
      expect(errors).toHaveLength(1);
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should show error when password is empty on submit', () => {
      renderLoginPage();
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      const errors = screen.getAllByText('Required');
      expect(errors).toHaveLength(1);
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should show errors when both fields are empty on submit', () => {
      renderLoginPage();
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(submitButton);

      const errors = screen.getAllByText('Required');
      expect(errors).toHaveLength(2);
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only email', () => {
      renderLoginPage();
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: '   ' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only password', () => {
      renderLoginPage();
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });
  });

  describe('Successful Login', () => {
    const mockUser = {
      user_id: '123',
      email: 'test@example.com',
      name: 'Test User',
      total_points: 100,
      current_level: 2
    };

    it('should call apiService.login with correct credentials', async () => {
      mockApiLogin.mockResolvedValue({ user: mockUser });
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should store user data in localStorage on successful login', async () => {
      mockApiLogin.mockResolvedValue({ user: mockUser });
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      });
    });

    it('should navigate to home page on successful login', async () => {
      mockApiLogin.mockResolvedValue({ user: mockUser });
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('should show loading state during login', async () => {
      mockApiLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Logging in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    it('should set user ID in extension storage when in extension environment', async () => {
      mockIsExtensionEnvironment.mockReturnValue(true);
      mockSetUserId.mockResolvedValue(undefined);
      mockApiLogin.mockResolvedValue({ user: mockUser });
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetUserId).toHaveBeenCalledWith('123');
      });
    });

    it('should handle setUserId error gracefully in extension environment', async () => {
      mockIsExtensionEnvironment.mockReturnValue(true);
      mockSetUserId.mockRejectedValue(new Error('Extension error'));
      mockApiLogin.mockResolvedValue({ user: mockUser });
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
      expect(console.error).toHaveBeenCalledWith('Failed to set user ID in extension:', expect.any(Error));
    });

    it('should not call setUserId when not in extension environment', async () => {
      mockIsExtensionEnvironment.mockReturnValue(false);
      mockApiLogin.mockResolvedValue({ user: mockUser });
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
      expect(mockSetUserId).not.toHaveBeenCalled();
    });
  });

  describe('Login Errors', () => {
    it('should display error message when login fails with Error object', async () => {
      const errorMessage = 'Invalid credentials';
      mockApiLogin.mockRejectedValue(new Error(errorMessage));
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should display network error message when login fails without Error object', async () => {
      mockApiLogin.mockRejectedValue('Some non-Error object');
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
      });
    });

    it('should clear previous error when submitting again', async () => {
      mockApiLogin.mockRejectedValueOnce(new Error('First error'));
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Submit again
      mockApiLogin.mockResolvedValue({ user: { user_id: '123', total_points: 100, current_level: 2 } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      mockApiLogin.mockRejectedValue(new Error('Login failed'));
      
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to signup page when sign up button is clicked', () => {
      renderLoginPage();
      
      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpButton);

      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
  });

  describe('Password Toggle During Loading', () => {
    it('should disable password toggle button during loading', async () => {
      mockApiLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /log in/i });
      const toggleButton = screen.getByRole('button', { name: /show/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(toggleButton).toBeDisabled();
    });
  });
});