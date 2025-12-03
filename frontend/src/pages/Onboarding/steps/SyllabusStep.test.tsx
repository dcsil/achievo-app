import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import SyllabusStep from './SyllabusStep';

// Mock child components with minimal interactive stubs
jest.mock('../../../components/pdf-upload', () => {
  return function PdfUploadForm({
    courses,
    selectedCourseId,
    onCourseChange,
    onFileSelect,
    onUpload,
    uploadButtonText,
    title,
    subtitle,
  }: any) {
    return (
      <div>
        <h4>{title}</h4>
        <p>{subtitle}</p>
        <label htmlFor="course-select">Course</label>
        <select
          aria-label="course-select"
          value={selectedCourseId}
          onChange={(e) => onCourseChange(e.target.value)}
        >
          <option value="">Select course</option>
          {courses.map((c: any) => (
            <option key={c.course_id} value={c.course_id}>
              {c.course_name || c.course_id}
            </option>
          ))}
        </select>
        <input
          aria-label="file-input"
          type="file"
          onChange={(e) => onFileSelect(e as any)}
        />
        <button onClick={onUpload}>{uploadButtonText}</button>
      </div>
    );
  };
});

jest.mock('../../../components/multiple-task-container', () => {
  return function MultipleTaskContainer({ tasks }: any) {
    return (
      <div>
        <div data-testid="multiple-task-container-count">{tasks?.length ?? 0}</div>
      </div>
    );
  };
});

jest.mock('../../../components/assignment-progress-container', () => {
  return function AssignmentProgressContainer({ assignments }: any) {
    return (
      <div>
        <div data-testid="assignment-progress-count">{assignments?.length ?? 0}</div>
      </div>
    );
  };
});

// Mock APIs
const mockGetCourses = jest.fn();
jest.mock('../../../api-contexts/get-courses', () => ({
  getCourses: (...args: any[]) => mockGetCourses(...args),
}));

const mockValidatePdfFile = jest.fn();
jest.mock('../../../api-contexts/syllabi-api', () => ({
  validatePdfFile: (file: File) => mockValidatePdfFile(file),
}));

const mockCreateAssignment = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../api-contexts/add-assignments', () => ({
  assignmentsApiService: { createAssignment: (...args: any[]) => mockCreateAssignment(...args) },
}));

const mockCreateTask = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../api-contexts/add-tasks', () => ({
  tasksApiService: { createTask: (...args: any[]) => mockCreateTask(...args) },
}));

describe('SyllabusStep', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Ensure localStorage has a user for userId
    window.localStorage.setItem('user', JSON.stringify({ user_id: 'test_user' }));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = () => {
    const onNext = jest.fn();
    const onBack = jest.fn();
    render(<SyllabusStep onNext={onNext} onBack={onBack} />);
    return { onNext };
  };

  it('shows "No courses found" when getCourses returns empty', async () => {
    mockGetCourses.mockResolvedValueOnce([]);
    await act(async () => {
      setup();
    });
    expect(screen.getByText('Great! Now let\'s upload your syllabi')).toBeInTheDocument();
    expect(screen.getByText('No courses found')).toBeInTheDocument();
    expect(
      screen.getByText(/Please upload your timetable first to create courses/i)
    ).toBeInTheDocument();
    // Skip button label shown when not saved yet
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('processes syllabus and shows results, then saving marks success', async () => {
    // Provide one course
    mockGetCourses.mockResolvedValueOnce([{ course_id: 'CSC101', course_name: 'Intro CS' }]);
    mockValidatePdfFile.mockReturnValue({ valid: true });

    let onNextSpy: jest.Mock;
    await act(async () => {
      const { onNext } = setup();
      onNextSpy = onNext;
    });

    // Select course
    const courseSelect = await screen.findByLabelText('course-select');
    fireEvent.change(courseSelect, { target: { value: 'CSC101' } });

    // Select file
    const fileInput = screen.getByLabelText('file-input') as HTMLInputElement;
    const file = new File(['dummy'], 'syllabus.pdf', { type: 'application/pdf' });
    // The component expects event.target.files[0], our mock forwards the event as-is
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Click process
    const processBtn = screen.getByRole('button', { name: /process syllabus/i });
    act(() => {
      fireEvent.click(processBtn);
    });

    // Advance the internal 2s timeout used in handleUpload
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Summary appears
    const summaryHeading = screen.getByText('✅ Processing Complete!');
    expect(summaryHeading).toBeInTheDocument();

    // Scope to summary container to avoid duplicate text matches
    const summaryContainer = summaryHeading.closest('div')!;
    expect(within(summaryContainer).getByText('Assignments')).toBeInTheDocument();
    expect(within(summaryContainer).getByText('Exams/Quizzes')).toBeInTheDocument();
    expect(within(summaryContainer).getByText('Micro-tasks')).toBeInTheDocument();

    // Save to dashboard
    const saveBtn = screen.getByRole('button', { name: /save to dashboard/i });
    expect(saveBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Calls to APIs have been made at least once
    expect(mockCreateAssignment).toHaveBeenCalled();
    expect(mockCreateTask).toHaveBeenCalled();

    // Success message appears and "Upload Another Syllabus" button shows
    expect(
      screen.getByText(/Syllabus saved successfully/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /upload another syllabus/i })
    ).toBeInTheDocument();

    // Continue button label switches from Skip to Continue
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();

    // Clicking Continue triggers onNext
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(onNextSpy!).toHaveBeenCalledTimes(1);
  });
});
