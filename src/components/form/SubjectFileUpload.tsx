"use client";

import React from "react";
import FileInput from "@/components/ui/FileInput";
import { MESSAGES } from "@/constants/messages";
import { FileUploadType } from "@/types/form";
import {
  ACCEPTED_FILE_TYPES,
  MAX_PDF_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGES_PER_SUBJECT,
} from "@/constants/subjects";

interface SubjectFileUploadProps {
  subjectCode: string;
  subjectName: string;
  fileType: FileUploadType;
  files: File[];
  uploadProgress: number;
  error?: string;
  onSetFileType: (fileType: FileUploadType) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export default function SubjectFileUpload({
  subjectCode,
  subjectName,
  fileType,
  files,
  uploadProgress,
  error,
  onSetFileType,
  onAddFiles,
  onRemoveFile,
  disabled = false,
}: SubjectFileUploadProps) {
  const hasPdf = files.length > 0 && files[0].type === "application/pdf";
  const hasImages = files.length > 0 && files[0].type.startsWith("image/");
  const imageCount = hasImages ? files.length : 0;
  const canAddMoreImages = imageCount < MAX_IMAGES_PER_SUBJECT;

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (fileType === "pdf") {
        if (!isPdf) {
          errors.push(MESSAGES.errors.invalidFileType);
          continue;
        }
        if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
          errors.push(MESSAGES.errors.pdfTooLarge);
          continue;
        }
        if (files.length > 0) {
          errors.push("केवल 1 PDF अपलोड कर सकते हैं / Only 1 PDF can be uploaded");
          continue;
        }
      } else {
        if (!isImage) {
          errors.push(MESSAGES.errors.invalidFileType);
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          errors.push(MESSAGES.errors.imageTooLarge);
          continue;
        }
        if (files.length + validFiles.length >= MAX_IMAGES_PER_SUBJECT) {
          errors.push(MESSAGES.errors.maxImagesExceeded);
          break;
        }
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(errors[0]);
    }

    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
  };

  const handleFileTypeChange = (newType: FileUploadType) => {
    if (files.length > 0) {
      if (!confirm("फाइल टाइप बदलने से अपलोड की गई फाइलें हट जाएंगी। क्या आप जारी रखना चाहते हैं?")) {
        return;
      }
    }
    onSetFileType(newType);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleFileTypeChange("pdf")}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm rounded-md transition-all
            ${fileType === "pdf"
              ? "bg-primary-700 text-white"
              : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {MESSAGES.uploadPdf}
        </button>
        <button
          type="button"
          onClick={() => handleFileTypeChange("images")}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm rounded-md transition-all
            ${fileType === "images"
              ? "bg-primary-700 text-white"
              : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {MESSAGES.uploadImages}
        </button>
      </div>

      {fileType === "pdf" ? (
        files.length === 0 ? (
          <FileInput
            label={`${subjectName} की PDF अपलोड करें`}
            accept={ACCEPTED_FILE_TYPES.pdf.accept}
            onChange={handleFileSelect}
            hint={`अधिकतम ${MAX_PDF_SIZE_MB} MB`}
            disabled={disabled}
          />
        ) : (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md border border-green-200">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-text-primary truncate flex-1">
              {files[0].name}
            </span>
            <button
              type="button"
              onClick={() => onRemoveFile(0)}
              disabled={disabled}
              className="text-text-error hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {MESSAGES.imagesUploaded} {imageCount}/{MAX_IMAGES_PER_SUBJECT}
            </span>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative group bg-gray-100 rounded-md p-2 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-text-primary truncate flex-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    disabled={disabled}
                    className="text-gray-400 hover:text-text-error transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {canAddMoreImages && (
            <FileInput
              label="Images जोड़ें"
              accept={ACCEPTED_FILE_TYPES.images.accept}
              multiple
              onChange={handleFileSelect}
              hint={`प्रति image अधिकतम ${MAX_IMAGE_SIZE_MB} MB (JPG, PNG)`}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-text-error">{error}</p>
      )}
    </div>
  );
}
