import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WelcomeStep from './WelcomeStep';

jest.mock('../../../components/pdf-upload', () => {
  return function PdfUploadForm({
    selectedFile,
    onFileSelect,
    onUpload,
    uploadButtonText,
    title,
    subtitle,
    error, // include error from props
  }: any) {
    return (
      <div>
        <h4>{title}</h4>
        <p>{subtitle}</p>
        {/* render error so tests can assert */}
        {error ? <div role="alert">{error}</div> : null}
        <input aria-label="file-input" type="file" onChange={onFileSelect} />
        <button onClick={onUpload}>{uploadButtonText}</button>
      </div>
    );
  };
});

jest.mock('../../../components/multiple-task-container', () => {
  return function MultipleTaskContainer({ tasks, dateString }: any) {
    return (
      <div>
        <div data-testid="mtc-date">{dateString}</div>
        <div data-testid="mtc-count">{tasks?.length ?? 0}</div>
      </div>
    );
  };
});

jest.mock('../../../components/course-container', () => {
  return function CourseContainer({ name, courseId }: any) {
    return (
      <div>
        <div data-testid="course-name">{name}</div>
        <div data-testid="course-id">{courseId}</div>
      </div>
    );
  };
});

// Mock APIs
const mockProcessTimetable = jest.fn();
jest.mock('../../../api-contexts/timetable-context', () => ({
  timetableApiService: { processTimetable: (...args: any[]) => mockProcessTimetable(...args) },
}));

const mockCreateTask = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../api-contexts/add-tasks', () => ({
  tasksApiService: { createTask: (...args: any[]) => mockCreateTask(...args) },
}));

const mockBulkCreateCourses = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../api-contexts/add-courses', () => ({
  addCoursesApiService: { bulkCreateCourses: (...args: any[]) => mockBulkCreateCourses(...args) },
}));

describe('WelcomeStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem('user', JSON.stringify({ user_id: 'test_user' }));
  });

  const setup = () => {
    const onNext = jest.fn();
    render(<WelcomeStep onNext={onNext} />);
    return { onNext };
  };

  it('renders header and upload form', () => {
    setup();
    expect(
      screen.getByText("Welcome to Achievo! Let's get started by uploading timetable")
    ).toBeInTheDocument();
    expect(screen.getByText('Upload PDF Timetable')).toBeInTheDocument();
    expect(
      screen.getByText(/Upload your PDF timetable to automatically extract courses/i)
    ).toBeInTheDocument();
    // Skip visible initially
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('processes timetable and shows results, then saving shows success and Continue', async () => {
    const { onNext } = setup();

    // Mock processed result
    const mockResult = {
      courses_found: 2,
      tasks_generated: 3,
      config: { term: 'Fall 2025' },
      courses: [
        { course_id: 'CSC101', course_name: 'Intro CS', color: 'blue' },
        { course_id: 'MAT135', course_name: 'Calculus I', color: 'green' },
      ],
      tasks: [
        {
          task_id: 't1',
          user_id: 'test_user',
          description: 'CSC101 Lecture',
          type: 'class',
          assignment_id: null,
          course_id: 'CSC101',
          scheduled_start_at: '2025-09-01T09:00:00Z',
          scheduled_end_at: '2025-09-01T10:00:00Z',
          reward_points: 5,
        },
        {
          task_id: 't2',
          user_id: 'test_user',
          description: 'CSC101 Lab',
          type: 'class',
          assignment_id: null,
          course_id: 'CSC101',
          scheduled_start_at: '2025-09-02T09:00:00Z',
          scheduled_end_at: '2025-09-02T10:00:00Z',
          reward_points: 5,
        },
        {
          task_id: 't3',
          user_id: 'test_user',
          description: 'MAT135 Lecture',
          type: 'class',
          assignment_id: null,
          course_id: 'MAT135',
          scheduled_start_at: '2025-09-01T11:00:00Z',
          scheduled_end_at: '2025-09-01T12:00:00Z',
          reward_points: 5,
        },
      ],
    };
    mockProcessTimetable.mockResolvedValueOnce(mockResult);

    // Choose file and process
    const fileInput = screen.getByLabelText('file-input') as HTMLInputElement;
    const file = new File(['dummy'], 'timetable.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const processBtn = screen.getByRole('button', { name: /process timetable/i });
    await act(async () => {
      fireEvent.click(processBtn);
    });

    // Summary appears
    expect(screen.getByText('✅ Processing Complete!')).toBeInTheDocument();
    expect(screen.getByText('Courses Found')).toBeInTheDocument();
    expect(screen.getByText('Tasks Generated')).toBeInTheDocument();
    expect(screen.getByText('Term')).toBeInTheDocument();
    expect(screen.getByText('Fall 2025')).toBeInTheDocument();

    // Courses & Generated Tasks section
    expect(screen.getByText('📚 Courses & Generated Tasks')).toBeInTheDocument();
    // Course headers (from mocked CourseContainer)
    expect(screen.getAllByTestId('course-name').map(el => el.textContent)).toEqual([
      'Intro CS',
      'Calculus I',
    ]);

    // Save to Dashboard
    const saveBtn = screen.getByRole('button', { name: /save to dashboard/i });
    expect(saveBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // API calls for saving
    expect(mockBulkCreateCourses).toHaveBeenCalledWith(mockResult.courses);
    expect(mockCreateTask).toHaveBeenCalledTimes(mockResult.tasks.length);

    // Success message and Continue button
    expect(screen.getByText(/Timetable saved successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();

    // Continue calls onNext
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows error when a non-PDF file is selected', () => {
    setup();
    const fileInput = screen.getByLabelText('file-input') as HTMLInputElement;
    const badFile = new File(['dummy'], 'image.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });
    // assert via role="alert" to be resilient
    expect(screen.getByRole('alert')).toHaveTextContent(/please select a pdf file/i);
  });
});