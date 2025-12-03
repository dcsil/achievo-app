import React, { useState } from 'react';

interface ImageUploadFormProps {
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  error: string;
  uploadButtonText?: string;
  previewUrl?: string | null;
}

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  selectedFile,
  onFileSelect,
  onUpload,
  isUploading,
  error,
  uploadButtonText = 'Upload Image',
  previewUrl
}) => {
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
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileSelect(fakeEvent);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="image-upload-dropzone"
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              {/** If a preview URL is provided show the image here, otherwise fall back to the SVG icon */}
              {previewUrl ? (
                <div className="w-32 h-32 rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="w-full h-full object-cover"
                    decoding="async"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>
            <div>
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-orange-600 font-medium hover:text-orange-500">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={onFileSelect}
                className="sr-only"
              />
            </div>
            <p className="text-xs text-gray-500">Image files only (PNG, JPG, GIF). Recommended under 5MB.</p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-green-700 text-sm font-medium">{selectedFile.name}</span>
            </div>
            <div>
              <button
                onClick={onUpload}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isUploading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
              >
                {isUploading ? 'Uploading...' : uploadButtonText}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ImageUploadForm;
