import React, { useState } from 'react';

interface PdfUploadFormProps {
  courses: Array<{ course_id: string; name: string }>;
  selectedCourseId: string;
  onCourseChange: (courseId: string) => void;
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  error: string;
  uploadButtonText?: string;
  title?: string;
  subtitle?: string;
}

const PdfUploadForm: React.FC<PdfUploadFormProps> = ({
  courses,
  selectedCourseId,
  onCourseChange,
  selectedFile,
  onFileSelect,
  onUpload,
  isUploading,
  error,
  uploadButtonText = "Process PDF",
  title = "Upload PDF",
  subtitle = "Select a course and upload a PDF file"
}) => {
  const needsCourseSelection = courses.length > 0;
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      // Create a proper fake event or use a more direct approach
      const fakeEvent = {
        target: { files: [droppedFile] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileSelect(fakeEvent);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 text-sm">{subtitle}</p>
      </div>

      <div className="space-y-6">
        {/* Course Selection - Only show if courses are provided */}
        {needsCourseSelection && (
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
              Select Course *
            </label>
            <select
              id="course"
              value={selectedCourseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF File *
          </label>
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragOver 
                ? 'border-orange-400 bg-orange-50' 
                : 'border-gray-300 hover:border-orange-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-orange-600 font-medium hover:text-orange-500">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={onFileSelect}
                  className="sr-only"
                />
              </div>
              <p className="text-xs text-gray-500">PDF files only, up to 10MB</p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 text-sm font-medium">{selectedFile.name}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={onUpload}
          disabled={!selectedFile || (needsCourseSelection && !selectedCourseId) || isUploading}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
            !selectedFile || (needsCourseSelection && !selectedCourseId) || isUploading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Processing...
            </div>
          ) : (
            uploadButtonText
          )}
        </button>
      </div>
    </div>
  );
};

export default PdfUploadForm;