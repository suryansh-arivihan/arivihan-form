"use client";

import { useState, useCallback } from "react";
import { PresignedUrlRequest, PresignedUrlResponse, SubmissionType } from "@/types/form";

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

interface StudentInfo {
  studentName: string;
  mobileNumber: string;
}

interface AnswerSheetUploadOptions {
  subjectCode: string;
  submissionType: SubmissionType;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const getPresignedUrl = async (
    request: PresignedUrlRequest
  ): Promise<PresignedUrlResponse | null> => {
    try {
      const response = await fetch("/api/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to get presigned URL");
      }

      return response.json();
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      return null;
    }
  };

  const uploadFile = async (
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        resolve(xhr.status >= 200 && xhr.status < 300);
      });

      xhr.addEventListener("error", () => {
        resolve(false);
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const uploadAdmitCard = useCallback(
    async (
      file: File,
      studentInfo: StudentInfo,
      onProgress?: (progress: number) => void
    ): Promise<UploadResult> => {
      setIsUploading(true);

      try {
        const presignedData = await getPresignedUrl({
          fileName: file.name,
          fileType: file.type,
          folder: "admit-cards",
          studentName: studentInfo.studentName,
          mobileNumber: studentInfo.mobileNumber,
        });

        if (!presignedData) {
          return { success: false, error: "Failed to get upload URL" };
        }

        const uploadSuccess = await uploadFile(file, presignedData.uploadUrl, onProgress);

        if (!uploadSuccess) {
          return { success: false, error: "Failed to upload file" };
        }

        return { success: true, fileUrl: presignedData.fileUrl };
      } catch (error) {
        return { success: false, error: "Upload failed" };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const uploadAnswerSheets = useCallback(
    async (
      files: File[],
      studentInfo: StudentInfo,
      options: AnswerSheetUploadOptions,
      onProgress?: (progress: number) => void
    ): Promise<{ success: boolean; fileUrls: string[]; errors: string[] }> => {
      setIsUploading(true);

      const fileUrls: string[] = [];
      const errors: string[] = [];
      let completedFiles = 0;

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          const presignedData = await getPresignedUrl({
            fileName: file.name,
            fileType: file.type,
            folder: "answer-sheets",
            studentName: studentInfo.studentName,
            mobileNumber: studentInfo.mobileNumber,
            subjectCode: options.subjectCode,
            submissionType: options.submissionType,
            imageIndex: files.length > 1 ? i : undefined, // Only use index for multiple images
          });

          if (!presignedData) {
            errors.push(`Failed to get upload URL for ${file.name}`);
            completedFiles++;
            continue;
          }

          const uploadSuccess = await uploadFile(
            file,
            presignedData.uploadUrl,
            (fileProgress) => {
              if (onProgress) {
                const overallProgress = Math.round(
                  ((completedFiles + fileProgress / 100) / files.length) * 100
                );
                onProgress(overallProgress);
              }
            }
          );

          if (uploadSuccess) {
            fileUrls.push(presignedData.fileUrl);
          } else {
            errors.push(`Failed to upload ${file.name}`);
          }

          completedFiles++;
        }

        return {
          success: errors.length === 0,
          fileUrls,
          errors,
        };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    isUploading,
    uploadAdmitCard,
    uploadAnswerSheets,
  };
}
