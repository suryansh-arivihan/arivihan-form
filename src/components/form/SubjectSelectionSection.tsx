"use client";

import React from "react";
import FormCard from "@/components/ui/FormCard";
import Checkbox from "@/components/ui/Checkbox";
import SubjectFileUpload from "./SubjectFileUpload";
import { MESSAGES } from "@/constants/messages";
import { SUBJECTS } from "@/constants/subjects";
import { SubmissionType, SubjectFile, FileUploadType, FormErrors } from "@/types/form";

interface SubjectSelectionSectionProps {
  submissionType: SubmissionType;
  selectedSubjects: string[];
  subjectFiles: Record<string, SubjectFile>;
  errors: FormErrors;
  onToggleSubject: (subjectCode: string) => void;
  onSetFileType: (subjectCode: string, fileType: FileUploadType) => void;
  onAddFiles: (subjectCode: string, files: File[]) => void;
  onRemoveFile: (subjectCode: string, fileIndex: number) => void;
  disabled?: boolean;
  usedSubjects?: string[];
  remainingQuota?: number;
}

export default function SubjectSelectionSection({
  submissionType,
  selectedSubjects,
  subjectFiles,
  errors,
  onToggleSubject,
  onSetFileType,
  onAddFiles,
  onRemoveFile,
  disabled = false,
  usedSubjects = [],
  remainingQuota,
}: SubjectSelectionSectionProps) {
  const instructions = submissionType === "arivihan_model_paper"
    ? MESSAGES.arivihanInstructions
    : MESSAGES.ownInstructions;

  // Calculate effective remaining: consider both overall quota and current selection
  const effectiveRemaining = remainingQuota !== undefined
    ? remainingQuota - selectedSubjects.length
    : (submissionType === "arivihan_model_paper" ? 3 : 1) - selectedSubjects.length;

  const maxSubjectsAllowed = remainingQuota !== undefined
    ? remainingQuota
    : (submissionType === "arivihan_model_paper" ? 3 : 1);

  const isMaxReached = effectiveRemaining <= 0;

  return (
    <FormCard hasTopBorder>
      <h3 className="text-base font-medium text-text-primary mb-1">
        {MESSAGES.subjectSelectionSection}
        <span className="text-text-error ml-1">*</span>
      </h3>

      <div className="mt-3 mb-6 p-4 bg-primary-50 rounded-lg text-sm text-text-secondary whitespace-pre-line">
        {instructions}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          {MESSAGES.selectedSubjects} {selectedSubjects.length}/{maxSubjectsAllowed}
        </span>
        {usedSubjects.length > 0 && (
          <span className="text-xs text-text-error">
            {usedSubjects.length} विषय पहले जमा हो चुके हैं
          </span>
        )}
      </div>

      <div className="space-y-4">
        {SUBJECTS.map((subject) => {
          const isSelected = selectedSubjects.includes(subject.code);
          const isAlreadySubmitted = usedSubjects.includes(subject.code);
          const isDisabled = disabled || isAlreadySubmitted || (!isSelected && isMaxReached);
          const subjectFile = subjectFiles[subject.code];

          return (
            <div key={subject.code} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start gap-2">
                <Checkbox
                  label={`${subject.nameHi} (${subject.nameEn})`}
                  checked={isSelected}
                  onChange={() => onToggleSubject(subject.code)}
                  disabled={isDisabled}
                  name={`subject-${subject.code}`}
                />
                {isAlreadySubmitted && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded mt-0.5">
                    जमा हो चुका
                  </span>
                )}
              </div>

              {isSelected && (
                <div className="mt-4 ml-8">
                  <SubjectFileUpload
                    subjectCode={subject.code}
                    subjectName={`${subject.nameHi} (${subject.nameEn})`}
                    fileType={subjectFile?.fileType || "images"}
                    files={subjectFile?.files || []}
                    uploadProgress={subjectFile?.uploadProgress || 0}
                    error={errors.subjectFiles?.[subject.code] || subjectFile?.error}
                    onSetFileType={(fileType) => onSetFileType(subject.code, fileType)}
                    onAddFiles={(files) => onAddFiles(subject.code, files)}
                    onRemoveFile={(index) => onRemoveFile(subject.code, index)}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errors.subjects && (
        <p className="mt-4 text-sm text-text-error">{errors.subjects}</p>
      )}
    </FormCard>
  );
}
