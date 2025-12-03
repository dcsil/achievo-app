import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Settings from './index';
import { apiService, User } from '../../api-contexts/user-context';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    updateUser: jest.fn(),
    getUser: jest.fn(),
  },
  User: {} as any,
}));

jest.mock('../../components/notification-enable', () => {
  return function NotificationEnable() {
    return <div data-testid="notification-enable">Notification Enable Component</div>;
  };
});

jest.mock('../../components/image-upload', () => {
  return function ImageUploadForm({ onFileSelect, onUpload, previewUrl }: any) {
    return (
      <div data-testid="image-upload-form">
        <input
          data-testid="file-input"
          type="file"
          onChange={onFileSelect}
        />
        <button data-testid="upload-button" onClick={onUpload}>
          Upload
        </button>
        {previewUrl && <img data-testid="preview-image" src={previewUrl} alt="Preview" />}
      </div>
    );
  };
});

const mockNavigate = jest.fn();

describe('Settings Component', () => {
  const mockUser: User = {
    user_id: 'test-user-123',
    canvas_username: 'testuser',
    canvas_domain: 'test.instructure.com',
    profile_picture: 'https://example.com/profile.jpg',
    total_points: 100,
    current_level: 5
  };

  const mockUpdateUserPoints = jest.fn();
  const mockUpdateUserProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    localStorage.clear();
    window.alert = jest.fn();
    window.confirm = jest.fn();
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <Settings
          user={mockUser}
          updateUserPoints={mockUpdateUserPoints}
          updateUserProfile={mockUpdateUserProfile}
          userId="test-user-123"
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('Initial Rendering', () => {
    it('should render the settings page with all sections', () => {
      renderComponent();

      expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
      expect(screen.getByText('Customize your Achievo experience')).toBeInTheDocument();
      expect(screen.getByText('👤 Account & Profile')).toBeInTheDocument();
      expect(screen.getByText('🚀 Guide')).toBeInTheDocument();
      expect(screen.getByText('🔔 Notifications')).toBeInTheDocument();
      expect(screen.getByText('🎨 Personalization (Dummy)')).toBeInTheDocument();
      expect(screen.getByText('🔧 Account Management (Dummy)')).toBeInTheDocument();
    });

    it('should display user profile information', () => {
      renderComponent();

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test.instructure.com')).toBeInTheDocument();
    });

    it('should show default profile picture when none is set', () => {
      const userWithoutPicture = { ...mockUser, profile_picture: '' };
      renderComponent({ user: userWithoutPicture });

      expect(screen.getByText('No image')).toBeInTheDocument();
    });
  });

  describe('Profile Editing', () => {
    it('should enter edit mode when Edit Profile is clicked', () => {
      renderComponent();

      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should allow editing canvas username', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });

      expect(usernameInput).toHaveValue('newusername');
    });

    it('should allow editing canvas domain', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const domainInput = screen.getByPlaceholderText('e.g., myschool.instructure.com');
      fireEvent.change(domainInput, { target: { value: 'newdomain.instructure.com' } });

      expect(domainInput).toHaveValue('newdomain.instructure.com');
    });

    it('should allow editing canvas API key', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const apiKeyInput = screen.getByPlaceholderText('Enter your Canvas API key (optional)');
      fireEvent.change(apiKeyInput, { target: { value: 'new-api-key-123' } });

      expect(apiKeyInput).toHaveValue('new-api-key-123');
    });

    it('should cancel editing and reset changes', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'changedusername' } });

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  describe('Image Upload', () => {
    it('should handle image file selection and preview', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');

      // Mock FileReader
      const mockFileReader: any = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:image/png;base64,mockbase64',
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate FileReader onload
      await waitFor(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: 'data:image/png;base64,mockbase64' } });
        }
      });

      await waitFor(() => {
        expect(mockFileReader.readAsDataURL).toHaveBeenCalled();
      });
    });

    it('should reject non-image files', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('file-input');

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(window.alert).toHaveBeenCalledWith('Please select an image file (PNG, JPG, GIF)');
    });

    it('should handle upload button click', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Should handle the case where no file is selected
      await waitFor(() => {
        expect(uploadButton).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save profile changes successfully', async () => {
      (apiService.updateUser as jest.Mock).mockResolvedValue({});
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'updatedusername' } });

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.updateUser).toHaveBeenCalledWith('test-user-123', {
          canvas_username: 'updatedusername',
        });
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Settings saved successfully!');
      });

      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        canvas_username: 'updatedusername',
      });
    });

    it('should save multiple changed fields', async () => {
      (apiService.updateUser as jest.Mock).mockResolvedValue({});
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });

      const domainInput = screen.getByPlaceholderText('e.g., myschool.instructure.com');
      fireEvent.change(domainInput, { target: { value: 'newdomain.com' } });

      const apiKeyInput = screen.getByPlaceholderText('Enter your Canvas API key (optional)');
      fireEvent.change(apiKeyInput, { target: { value: 'new-key' } });

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.updateUser).toHaveBeenCalledWith('test-user-123', {
          canvas_username: 'newusername',
          canvas_domain: 'newdomain.com',
          canvas_api_key: 'new-key',
        });
      });
    });

    it('should handle save without user ID', async () => {
      renderComponent({ user: { ...mockUser, user_id: undefined } });

      fireEvent.click(screen.getByText('Edit Profile'));

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error: User ID not available');
      });
    });

    it('should handle save errors', async () => {
      (apiService.updateUser as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'updatedusername' } });

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error saving settings. Please try again.');
      });
    });

    it('should not call API if no changes were made', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Settings saved successfully!');
      });

      expect(apiService.updateUser).not.toHaveBeenCalled();
    });

    it('should update localStorage after successful save', async () => {
      (apiService.updateUser as jest.Mock).mockResolvedValue({});
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'updatedusername' } });

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.getUser).toHaveBeenCalledWith('test-user-123');
      });

      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should handle localStorage update failure gracefully', async () => {
      (apiService.updateUser as jest.Mock).mockResolvedValue({});
      (apiService.getUser as jest.Mock).mockRejectedValue(new Error('Failed to get user'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const usernameInput = screen.getByPlaceholderText('Enter your Canvas username');
      fireEvent.change(usernameInput, { target: { value: 'updatedusername' } });

      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to refresh user data after profile update:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Onboarding Steps', () => {
    it('should display all onboarding steps', () => {
      renderComponent();

      expect(screen.getByText('Timetable')).toBeInTheDocument();
      expect(screen.getByText('Interests (Dummy)')).toBeInTheDocument();
      expect(screen.getByText('Canvas (Dummy)')).toBeInTheDocument();
      expect(screen.getByText('Syllabi (Dummy)')).toBeInTheDocument();
    });

    it('should navigate to onboarding step when Open is clicked', () => {
      renderComponent();

      const openButtons = screen.getAllByText('Open');
      fireEvent.click(openButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/onboarding?fromSettings=true&targetStep=0&standalone=true'
      );
    });

    it('should navigate to different onboarding steps', () => {
      renderComponent();

      const openButtons = screen.getAllByText('Open');
      
      fireEvent.click(openButtons[1]);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/onboarding?fromSettings=true&targetStep=1&standalone=true'
      );

      fireEvent.click(openButtons[2]);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/onboarding?fromSettings=true&targetStep=2&standalone=true'
      );

      fireEvent.click(openButtons[3]);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/onboarding?fromSettings=true&targetStep=3&standalone=true'
      );
    });
  });

  describe('Account Management', () => {
    it('should handle reset data confirmation', () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderComponent();

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all your progress? This action cannot be undone.'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Resetting user data...');
      expect(window.alert).toHaveBeenCalledWith('Data reset successfully!');

      consoleSpy.mockRestore();
    });

    it('should cancel reset when user declines', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderComponent();

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle delete account confirmation', () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderComponent();

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete your account? This action cannot be undone.'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Deleting account...');
      expect(window.alert).toHaveBeenCalledWith(
        'Account deletion initiated. You will be contacted via email.'
      );

      consoleSpy.mockRestore();
    });

    it('should cancel delete when user declines', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderComponent();

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(window.alert).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('User Updates via Props', () => {
    it('should update profile state when user prop changes', () => {
      const { rerender } = renderComponent();

      const updatedUser = {
        ...mockUser,
        canvas_username: 'updateduser',
        canvas_domain: 'updated.instructure.com',
        profile_picture: 'https://example.com/new-profile.jpg',
      };

      rerender(
        <BrowserRouter>
          <Settings
            user={updatedUser}
            updateUserPoints={mockUpdateUserPoints}
            updateUserProfile={mockUpdateUserProfile}
            userId="test-user-123"
          />
        </BrowserRouter>
      );

      expect(screen.getByText('updateduser')).toBeInTheDocument();
      expect(screen.getByText('updated.instructure.com')).toBeInTheDocument();
    });
  });

  describe('FileReader Edge Cases', () => {
    it('should handle FileReader error', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');

      const mockFileReader: any = {
        readAsDataURL: jest.fn(),
        onload: null,
        onerror: null,
        result: null,
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate FileReader error
      await waitFor(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error('Read failed'));
        }
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to read image. Please try again.');
      });
    });

    it('should handle FileReader with null result', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');

      const mockFileReader: any = {
        readAsDataURL: jest.fn(),
        onload: null,
        onerror: null,
        result: null,
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate FileReader onload with null result
      await waitFor(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: null } });
        }
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to read image. Please try again.');
      });
    });
  });

  describe('Disabled Features', () => {
    it('should have disabled email input', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const emailInput = screen.getByPlaceholderText('Enter your email for notifications');
      expect(emailInput).toBeDisabled();
    });

    it('should have disabled bio textarea', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Edit Profile'));

      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself...');
      expect(bioTextarea).toBeDisabled();
    });
  });
});