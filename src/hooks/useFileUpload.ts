"use client";

import { useState, useCallback } from "react";
import { PresignedUrlRequest, PresignedUrlResponse } from "@/types/form";

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
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

  const uploadSingleFile = useCallback(
    async (
      file: File,
      folder: "admit-cards" | "answer-sheets",
      subjectCode?: string,
      onProgress?: (progress: number) => void
    ): Promise<UploadResult> => {
      setIsUploading(true);

      try {
        const presignedData = await getPresignedUrl({
          fileName: file.name,
          fileType: file.type,
          folder,
          subjectCode,
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

  const uploadMultipleFiles = useCallback(
    async (
      files: File[],
      folder: "admit-cards" | "answer-sheets",
      subjectCode?: string,
      onProgress?: (progress: number) => void
    ): Promise<{ success: boolean; fileUrls: string[]; errors: string[] }> => {
      setIsUploading(true);

      const fileUrls: string[] = [];
      const errors: string[] = [];
      let completedFiles = 0;

      try {
        for (const file of files) {
          const result = await uploadSingleFile(
            file,
            folder,
            subjectCode,
            (fileProgress) => {
              if (onProgress) {
                const overallProgress = Math.round(
                  ((completedFiles + fileProgress / 100) / files.length) * 100
                );
                onProgress(overallProgress);
              }
            }
          );

          if (result.success && result.fileUrl) {
            fileUrls.push(result.fileUrl);
          } else {
            errors.push(result.error || "Unknown error");
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
    [uploadSingleFile]
  );

  return {
    isUploading,
    uploadSingleFile,
    uploadMultipleFiles,
  };
}
