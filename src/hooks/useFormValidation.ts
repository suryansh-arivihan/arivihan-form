"use client";

import { useCallback } from "react";
import { FormData, FormErrors } from "@/types/form";
import { MESSAGES } from "@/constants/messages";
import {
  validateStudentName,
  validateMobileNumber,
} from "@/lib/validation/form-schema";

export function useFormValidation() {
  const validateForm = useCallback((formData: FormData): FormErrors => {
    const errors: FormErrors = {};

    const nameResult = validateStudentName(formData.studentName);
    if (!nameResult.success) {
      errors.studentName = nameResult.error.errors[0]?.message;
    }

    const mobileResult = validateMobileNumber(formData.mobileNumber);
    if (!mobileResult.success) {
      errors.mobileNumber = mobileResult.error.errors[0]?.message;
    }

    if (!formData.mediumOfStudy) {
      errors.mediumOfStudy = MESSAGES.errors.mediumRequired;
    }

    if (!formData.admitCardNumber && !formData.admitCardFile) {
      errors.admitCard = MESSAGES.errors.admitCardRequired;
    }

    if (!formData.submissionType) {
      errors.submissionType = MESSAGES.errors.submissionTypeRequired;
    }

    if (formData.submissionType && formData.selectedSubjects.length === 0) {
      errors.subjects = MESSAGES.errors.subjectRequired;
    }

    const subjectFileErrors: Record<string, string> = {};
    for (const subjectCode of formData.selectedSubjects) {
      const subjectFile = formData.subjectFiles[subjectCode];
      if (!subjectFile || subjectFile.files.length === 0) {
        subjectFileErrors[subjectCode] = MESSAGES.errors.fileRequired;
      }
    }

    if (Object.keys(subjectFileErrors).length > 0) {
      errors.subjectFiles = subjectFileErrors;
    }

    return errors;
  }, []);

  const hasErrors = useCallback((errors: FormErrors): boolean => {
    return (
      !!errors.studentName ||
      !!errors.mobileNumber ||
      !!errors.mediumOfStudy ||
      !!errors.admitCard ||
      !!errors.submissionType ||
      !!errors.subjects ||
      (errors.subjectFiles && Object.keys(errors.subjectFiles).length > 0) ||
      false
    );
  }, []);

  return {
    validateForm,
    hasErrors,
  };
}
