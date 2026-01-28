"use client";

import React from "react";
import FormCard from "@/components/ui/FormCard";
import TextInput from "@/components/ui/TextInput";
import RadioGroup from "@/components/ui/RadioGroup";
import FileInput from "@/components/ui/FileInput";
import { MESSAGES } from "@/constants/messages";
import { FormErrors, MediumOfStudy } from "@/types/form";
import {
  ACCEPTED_FILE_TYPES,
  MAX_ADMIT_CARD_SIZE_MB,
} from "@/constants/subjects";

interface StudentInfoSectionProps {
  studentName: string;
  mobileNumber: string;
  mediumOfStudy: MediumOfStudy | null;
  admitCardNumber: string;
  admitCardFile: File | null;
  admitCardFileUrl: string;
  errors: FormErrors;
  onStudentNameChange: (value: string) => void;
  onStudentNameBlur?: () => void;
  onMobileNumberChange: (value: string) => void;
  onMobileBlur?: () => void;
  onMediumOfStudyChange: (value: MediumOfStudy) => void;
  onAdmitCardNumberChange: (value: string) => void;
  onAdmitCardFileChange: (file: File | null) => void;
  isUploading?: boolean;
  isCheckingQuota?: boolean;
}

const mediumOptions = [
  { value: "hindi", label: MESSAGES.mediumHindi },
  { value: "english", label: MESSAGES.mediumEnglish },
];

export default function StudentInfoSection({
  studentName,
  mobileNumber,
  mediumOfStudy,
  admitCardNumber,
  admitCardFile,
  errors,
  onStudentNameChange,
  onStudentNameBlur,
  onMobileNumberChange,
  onMobileBlur,
  onMediumOfStudyChange,
  onAdmitCardNumberChange,
  onAdmitCardFileChange,
  isUploading = false,
  isCheckingQuota = false,
}: StudentInfoSectionProps) {
  const handleStudentNameChange = (value: string) => {
    // Only allow alphabetic characters (a-z, A-Z) and spaces
    const filteredValue = value.replace(/[^a-zA-Z\s]/g, "");
    onStudentNameChange(filteredValue);
  };

  const handleMobileChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 10);
    onMobileNumberChange(numericValue);
  };

  const handleAdmitCardFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = MAX_ADMIT_CARD_SIZE_MB * 1024 * 1024;

    if (file.size > maxSize) {
      alert(MESSAGES.errors.admitCardTooLarge);
      return;
    }

    if (!ACCEPTED_FILE_TYPES.admitCard.mimeTypes.includes(file.type)) {
      alert(MESSAGES.errors.invalidFileType);
      return;
    }

    onAdmitCardFileChange(file);
  };

  const handleRemoveAdmitCardFile = () => {
    onAdmitCardFileChange(null);
  };

  return (
    <FormCard hasTopBorder>
      <h3 className="text-base font-medium text-text-primary mb-6">
        {MESSAGES.studentInfoSection}
      </h3>

      <TextInput
        label={MESSAGES.studentName}
        name="studentName"
        value={studentName}
        onChange={handleStudentNameChange}
        onBlur={onStudentNameBlur}
        placeholder={MESSAGES.studentNamePlaceholder}
        required
        error={errors.studentName}
        maxLength={100}
      />

      <TextInput
        label={MESSAGES.mobileNumber}
        name="mobileNumber"
        value={mobileNumber}
        onChange={handleMobileChange}
        onBlur={onMobileBlur}
        placeholder={MESSAGES.mobileNumberPlaceholder}
        type="tel"
        required
        error={errors.mobileNumber}
      />
      {isCheckingQuota && (
        <p className="text-xs text-text-secondary -mt-4 mb-4">जाँच हो रही है... / Checking...</p>
      )}

      <div className="mb-6">
        <label className="block text-sm text-text-primary mb-2">
          {MESSAGES.mediumOfStudy}
          <span className="text-text-error ml-1">*</span>
        </label>
        <div className="mt-3">
          <RadioGroup
            name="mediumOfStudy"
            options={mediumOptions}
            value={mediumOfStudy}
            onChange={(v) => onMediumOfStudyChange(v as MediumOfStudy)}
            error={errors.mediumOfStudy}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-text-primary mb-2">
          {MESSAGES.admitCardNumber}
          <span className="text-text-error ml-1">*</span>
        </label>
        <p className="text-xs text-text-secondary mb-4">
          Admit Card Number भरें या Admit Card की फोटो अपलोड करें (कोई एक अनिवार्य है)
        </p>

        <TextInput
          label=""
          name="admitCardNumber"
          value={admitCardNumber}
          onChange={onAdmitCardNumberChange}
          placeholder={MESSAGES.admitCardNumberPlaceholder}
        />

        <div className="mt-4">
          <p className="text-sm text-text-secondary mb-2">या / OR</p>

          {admitCardFile ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-text-primary truncate flex-1">
                {admitCardFile.name}
              </span>
              <button
                type="button"
                onClick={handleRemoveAdmitCardFile}
                disabled={isUploading}
                className="text-text-error hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <FileInput
              label={MESSAGES.admitCardUpload}
              accept={ACCEPTED_FILE_TYPES.admitCard.accept}
              onChange={handleAdmitCardFileSelect}
              hint={`अधिकतम ${MAX_ADMIT_CARD_SIZE_MB} MB (JPG, PNG, PDF)`}
              disabled={isUploading}
            />
          )}
        </div>

        {errors.admitCard && (
          <p className="mt-2 text-sm text-text-error">{errors.admitCard}</p>
        )}
      </div>
    </FormCard>
  );
}
