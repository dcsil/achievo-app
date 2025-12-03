import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PdfUploadForm from './index';

// Mock file for testing
const createMockFile = (name: string, type: string, size: number = 1024) => {
  return new File(['mock content'], name, { type, lastModified: Date.now() });
};

// Mock courses data
const mockCourses = [
  { course_id: '1', name: 'Mathematics 101' },
  { course_id: '2', name: 'Physics 201' },
];

// Default props
const defaultProps = {
  courses: mockCourses,
  selectedCourseId: '',
  onCourseChange: jest.fn(),
  selectedFile: null,
  onFileSelect: jest.fn(),
  onUpload: jest.fn(),
  isUploading: false,
  error: '',
};

describe('PdfUploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default title and subtitle', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      expect(screen.getByText('Upload PDF')).toBeInTheDocument();
      expect(screen.getByText('Select a course and upload a PDF file')).toBeInTheDocument();
    });

    it('renders with custom title and subtitle', () => {
      render(
        <PdfUploadForm 
          {...defaultProps} 
          title="Custom Title"
          subtitle="Custom subtitle text"
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom subtitle text')).toBeInTheDocument();
    });

    it('renders course selection when courses are provided', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/select course/i)).toBeInTheDocument();
      expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      expect(screen.getByText('Physics 201')).toBeInTheDocument();
    });

    it('does not render course selection when no courses provided', () => {
      render(<PdfUploadForm {...defaultProps} courses={[]} />);
      
      expect(screen.queryByLabelText(/select course/i)).not.toBeInTheDocument();
    });

    it('renders upload button with default text', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /process pdf/i })).toBeInTheDocument();
    });

    it('renders upload button with custom text', () => {
      render(<PdfUploadForm {...defaultProps} uploadButtonText="Custom Upload" />);
      
      expect(screen.getByRole('button', { name: /custom upload/i })).toBeInTheDocument();
    });
  });

  describe('Course Selection', () => {
    it('calls onCourseChange when course is selected', () => {
      const mockOnCourseChange = jest.fn();
      render(<PdfUploadForm {...defaultProps} onCourseChange={mockOnCourseChange} />);
      
      const courseSelect = screen.getByLabelText(/select course/i);
      fireEvent.change(courseSelect, { target: { value: '1' } });
      
      expect(mockOnCourseChange).toHaveBeenCalledWith('1');
    });

    it('displays selected course', () => {
      render(<PdfUploadForm {...defaultProps} selectedCourseId="1" />);
      
      const courseSelect = screen.getByLabelText(/select course/i) as HTMLSelectElement;
      expect(courseSelect.value).toBe('1');
    });
  });

  describe('File Upload', () => {
    it('calls onFileSelect when file is selected', () => {
      const mockOnFileSelect = jest.fn();
      render(<PdfUploadForm {...defaultProps} onFileSelect={mockOnFileSelect} />);
      
      const fileInput = screen.getByLabelText(/click to upload/i);
      const file = createMockFile('test.pdf', 'application/pdf');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockOnFileSelect).toHaveBeenCalled();
    });

    it('displays selected file name', () => {
      const file = createMockFile('test-document.pdf', 'application/pdf');
      render(<PdfUploadForm {...defaultProps} selectedFile={file} />);
      
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    it('accepts only PDF files', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/click to upload/i);
      expect(fileInput).toHaveAttribute('accept', '.pdf');
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over event', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      const dropZone = screen.getByText(/click to upload/i).closest('.border-2');
      
      fireEvent.dragOver(dropZone!, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      });
      
      expect(dropZone).toHaveClass('border-orange-400', 'bg-orange-50');
    });

    it('handles drag leave event', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      const dropZone = screen.getByText(/click to upload/i).closest('.border-2');
      
      // First trigger drag over, then drag leave
      fireEvent.dragOver(dropZone!, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      });
      
      fireEvent.dragLeave(dropZone!, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      });
      
      expect(dropZone).not.toHaveClass('border-orange-400', 'bg-orange-50');
    });

    it('handles file drop event', () => {
      const mockOnFileSelect = jest.fn();
      render(<PdfUploadForm {...defaultProps} onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByText(/click to upload/i).closest('.border-2');
      const file = createMockFile('dropped.pdf', 'application/pdf');
      
      fireEvent.drop(dropZone!, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [file] },
      });
      
      expect(mockOnFileSelect).toHaveBeenCalled();
    });

    it('ignores non-PDF files in drop event', () => {
      const mockOnFileSelect = jest.fn();
      render(<PdfUploadForm {...defaultProps} onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByText(/click to upload/i).closest('.border-2');
      const file = createMockFile('test.txt', 'text/plain');
      
      fireEvent.drop(dropZone!, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [file] },
      });
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('Upload Button', () => {
    it('is disabled when no file is selected', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      const uploadButton = screen.getByRole('button', { name: /process pdf/i });
      expect(uploadButton).toBeDisabled();
    });

    it('is disabled when course is required but not selected', () => {
      const file = createMockFile('test.pdf', 'application/pdf');
      render(<PdfUploadForm {...defaultProps} selectedFile={file} />);
      
      const uploadButton = screen.getByRole('button', { name: /process pdf/i });
      expect(uploadButton).toBeDisabled();
    });

    it('is enabled when file is selected and course is selected (when required)', () => {
      const file = createMockFile('test.pdf', 'application/pdf');
      render(<PdfUploadForm {...defaultProps} selectedFile={file} selectedCourseId="1" />);
      
      const uploadButton = screen.getByRole('button', { name: /process pdf/i });
      expect(uploadButton).not.toBeDisabled();
    });

    it('is enabled when file is selected and no courses required', () => {
      const file = createMockFile('test.pdf', 'application/pdf');
      render(<PdfUploadForm {...defaultProps} courses={[]} selectedFile={file} />);
      
      const uploadButton = screen.getByRole('button', { name: /process pdf/i });
      expect(uploadButton).not.toBeDisabled();
    });

    it('calls onUpload when clicked', () => {
      const mockOnUpload = jest.fn();
      const file = createMockFile('test.pdf', 'application/pdf');
      render(
        <PdfUploadForm 
          {...defaultProps} 
          selectedFile={file} 
          selectedCourseId="1"
          onUpload={mockOnUpload}
        />
      );
      
      const uploadButton = screen.getByRole('button', { name: /process pdf/i });
      fireEvent.click(uploadButton);
      
      expect(mockOnUpload).toHaveBeenCalled();
    });

    it('shows loading state when uploading', () => {
      const file = createMockFile('test.pdf', 'application/pdf');
      render(
        <PdfUploadForm 
          {...defaultProps} 
          selectedFile={file} 
          selectedCourseId="1"
          isUploading={true}
        />
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Upload failed. Please try again.';
      render(<PdfUploadForm {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error message when error prop is empty', () => {
      render(<PdfUploadForm {...defaultProps} error="" />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form controls', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/select course/i)).toBeInTheDocument();
      expect(screen.getByText('PDF File *')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for disabled button', () => {
      render(<PdfUploadForm {...defaultProps} />);
      
      const uploadButton = screen.getByRole('button', { name: /process pdf/i });
      expect(uploadButton).toHaveAttribute('disabled');
    });
  });
});
