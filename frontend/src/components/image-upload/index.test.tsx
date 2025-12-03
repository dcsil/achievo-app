import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUploadForm from './index';

// Mock file for testing
const createMockFile = (name: string = 'test-image.jpg', type: string = 'image/jpeg') => {
  const file = new File(['fake image content'], name, { type });
  return file;
};

describe('ImageUploadForm', () => {
  const mockProps = {
    selectedFile: null,
    onFileSelect: jest.fn(),
    onUpload: jest.fn(),
    isUploading: false,
    error: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial render', () => {
    it('renders with custom upload button text', () => {
      render(<ImageUploadForm {...mockProps} uploadButtonText="Custom Upload" />);
      
      // The custom text should appear when a file is selected
      const file = createMockFile();
      const propsWithFile = { ...mockProps, selectedFile: file };
      
      render(<ImageUploadForm {...propsWithFile} uploadButtonText="Custom Upload" />);
      expect(screen.getByText('Custom Upload')).toBeInTheDocument();
    });

    it('displays preview image when preview URL is provided', () => {
      const previewUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ';
      render(<ImageUploadForm {...mockProps} previewUrl={previewUrl} />);
      
      const previewImage = screen.getByAltText('Selected preview');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', previewUrl);
    });
  });

  describe('File selection', () => {
    it('calls onFileSelect when file input changes', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const fileInput = screen.getByLabelText(/click to upload/i);
      const file = createMockFile();
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockProps.onFileSelect).toHaveBeenCalledTimes(1);
    });

    it('displays selected file information', () => {
      const file = createMockFile('my-image.png');
      const propsWithFile = { ...mockProps, selectedFile: file };
      
      render(<ImageUploadForm {...propsWithFile} />);
      
      expect(screen.getByText('my-image.png')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
    });

    it('shows upload button when file is selected', () => {
      const file = createMockFile();
      const propsWithFile = { ...mockProps, selectedFile: file };
      
      render(<ImageUploadForm {...propsWithFile} />);
      
      const uploadButton = screen.getByRole('button', { name: /upload image/i });
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).not.toBeDisabled();
    });
  });

  describe('Drag and drop functionality', () => {
    it('handles dragover event correctly', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      
      // Initially should have default styling
      expect(dropZone).toHaveClass('border-gray-300');
      expect(dropZone).not.toHaveClass('border-orange-400', 'bg-orange-50');
      
      // Trigger dragover event
      fireEvent.dragOver(dropZone);
      
      // Check if drag over styling is applied
      expect(dropZone).toHaveClass('border-orange-400', 'bg-orange-50');
      expect(dropZone).not.toHaveClass('border-gray-300');
    });

    it('handles dragleave event correctly', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      
      // First trigger dragover to set dragOver state to true
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-orange-400', 'bg-orange-50');
      
      // Then trigger dragleave
      fireEvent.dragLeave(dropZone);
      
      // Check if drag over styling is removed
      expect(dropZone).not.toHaveClass('border-orange-400', 'bg-orange-50');
      expect(dropZone).toHaveClass('border-gray-300');
    });

    it('handles drop event with image file correctly', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      const imageFile = createMockFile('dropped-image.jpg', 'image/jpeg');
      
      // Trigger drop event with image file
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [imageFile]
        }
      });
      
      // Verify onFileSelect was called
      expect(mockProps.onFileSelect).toHaveBeenCalledTimes(1);
      
      // Verify the fake event structure passed to onFileSelect
      const callArgs = mockProps.onFileSelect.mock.calls[0][0];
      expect(callArgs.target.files[0]).toBe(imageFile);
    });

    it('handles drop event with multiple files (selects first image)', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      const imageFile1 = createMockFile('image1.jpg', 'image/jpeg');
      const imageFile2 = createMockFile('image2.png', 'image/png');
      
      // Trigger drop event with multiple files
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [imageFile1, imageFile2]
        }
      });
      
      expect(mockProps.onFileSelect).toHaveBeenCalledTimes(1);
      
      // Should select the first file
      const callArgs = mockProps.onFileSelect.mock.calls[0][0];
      expect(callArgs.target.files[0]).toBe(imageFile1);
    });

    it('ignores dropped non-image files', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      const textFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
      
      // Trigger drop event with non-image file
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [textFile]
        }
      });
      
      // Should not call onFileSelect for non-image files
      expect(mockProps.onFileSelect).not.toHaveBeenCalled();
    });

    it('handles drop event with no files', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      
      // Trigger drop event with no files
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: []
        }
      });
      
      // Should not call onFileSelect when no files are dropped
      expect(mockProps.onFileSelect).not.toHaveBeenCalled();
    });

    it('resets drag state after successful drop', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const dropZone = screen.getByTestId('image-upload-dropzone');
      const imageFile = createMockFile();
      
      // First set drag state
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-orange-400', 'bg-orange-50');
      
      // Then drop file
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [imageFile]
        }
      });
      
      // Drag state should be reset
      expect(dropZone).not.toHaveClass('border-orange-400', 'bg-orange-50');
      expect(dropZone).toHaveClass('border-gray-300');
    });
  });

  describe('Upload functionality', () => {
    it('calls onUpload when upload button is clicked', () => {
      const file = createMockFile();
      const propsWithFile = { ...mockProps, selectedFile: file };
      
      render(<ImageUploadForm {...propsWithFile} />);
      
      const uploadButton = screen.getByRole('button', { name: /upload image/i });
      fireEvent.click(uploadButton);
      
      expect(mockProps.onUpload).toHaveBeenCalledTimes(1);
    });

    it('disables upload button and shows uploading state', () => {
      const file = createMockFile();
      const propsWithUploading = { 
        ...mockProps, 
        selectedFile: file, 
        isUploading: true 
      };
      
      render(<ImageUploadForm {...propsWithUploading} />);
      
      const uploadButton = screen.getByRole('button', { name: /uploading/i });
      expect(uploadButton).toBeDisabled();
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('shows custom upload button text when provided', () => {
      const file = createMockFile();
      const propsWithCustomText = { 
        ...mockProps, 
        selectedFile: file,
        uploadButtonText: 'Save Image'
      };
      
      render(<ImageUploadForm {...propsWithCustomText} />);
      
      expect(screen.getByRole('button', { name: /save image/i })).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('does not display error section when no error', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Styling and CSS classes', () => {

    it('applies correct button styling based on upload state', () => {
      const file = createMockFile();
      
      // Normal state
      const normalProps = { ...mockProps, selectedFile: file };
      const { rerender } = render(<ImageUploadForm {...normalProps} />);
      
      let uploadButton = screen.getByRole('button', { name: /upload image/i });
      expect(uploadButton).toHaveClass('bg-orange-500', 'hover:bg-orange-600');
      
      // Uploading state
      const uploadingProps = { ...mockProps, selectedFile: file, isUploading: true };
      rerender(<ImageUploadForm {...uploadingProps} />);
      
      uploadButton = screen.getByRole('button', { name: /uploading/i });
      expect(uploadButton).toHaveClass('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('has proper label association for file input', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const fileInput = screen.getByLabelText(/click to upload/i);
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('hides file input with sr-only class', () => {
      render(<ImageUploadForm {...mockProps} />);
      
      const fileInput = screen.getByLabelText(/click to upload/i);
      expect(fileInput).toHaveClass('sr-only');
    });

    it('provides proper alt text for preview image', () => {
      const previewUrl = 'test-image-url';
      render(<ImageUploadForm {...mockProps} previewUrl={previewUrl} />);
      
      const previewImage = screen.getByAltText('Selected preview');
      expect(previewImage).toBeInTheDocument();
    });
  });

  describe('Image rendering attributes', () => {
    it('sets proper attributes on preview image', () => {
      const previewUrl = 'test-image-url';
      render(<ImageUploadForm {...mockProps} previewUrl={previewUrl} />);
      
      const previewImage = screen.getByAltText('Selected preview');
      expect(previewImage).toHaveAttribute('decoding', 'async');
      expect(previewImage).toHaveStyle({ imageRendering: 'auto' });
    });
  });
});
