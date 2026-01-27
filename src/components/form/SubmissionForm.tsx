"use client";

import React, { useState, useCallback } from "react";
import FormHeader from "./FormHeader";
import FormInstructions from "./FormInstructions";
import StudentInfoSection from "./StudentInfoSection";
import SubmissionTypeSection from "./SubmissionTypeSection";
import SubjectSelectionSection from "./SubjectSelectionSection";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useFormState } from "@/hooks/useFormState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFormValidation } from "@/hooks/useFormValidation";
import { MESSAGES } from "@/constants/messages";
import { getSubjectByCode } from "@/constants/subjects";
import {
  FormErrors,
  SubmissionType,
  SubmissionResponse,
  QuotaCheckResponse,
} from "@/types/form";

interface QuotaState {
  arivihanSubjectsUsed: string[];
  ownSubjectsUsed: string[];
  arivihanRemaining: number;
  ownRemaining: number;
  isLoaded: boolean;
}

const initialQuotaState: QuotaState = {
  arivihanSubjectsUsed: [],
  ownSubjectsUsed: [],
  arivihanRemaining: 3,
  ownRemaining: 1,
  isLoaded: false,
};

export default function SubmissionForm() {
  const {
    formData,
    setStudentName,
    setMobileNumber,
    setMediumOfStudy,
    setAdmitCardNumber,
    setAdmitCardFile,
    setSubmissionType,
    toggleSubject,
    setSubjectFileType,
    addSubjectFiles,
    removeSubjectFile,
    setSubjectUploadProgress,
    setSubjectUploadedUrls,
    resetForm,
  } = useFormState();

  const { isUploading, uploadAdmitCard, uploadAnswerSheets } = useFileUpload();
  const { validateForm, hasErrors } = useFormValidation();

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
  const [quota, setQuota] = useState<QuotaState>(initialQuotaState);
  const [errorModalContent, setErrorModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const checkQuota = useCallback(async (name: string, mobile: string) => {
    if (mobile.length !== 10 || name.trim().length < 2) return;

    setIsCheckingQuota(true);
    try {
      const response = await fetch("/api/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: name, mobileNumber: mobile }),
      });

      const data = await response.json();

      // Check if response has an error
      if (!response.ok || data.error) {
        console.error("Quota check failed:", data.error);
        // Don't show error modal, just use default quota (allows user to proceed)
        setQuota({
          ...initialQuotaState,
          isLoaded: true,
        });
        return;
      }

      // Validate the response structure
      if (!data.quota) {
        console.error("Invalid quota response:", data);
        setQuota({
          ...initialQuotaState,
          isLoaded: true,
        });
        return;
      }

      setQuota({
        arivihanSubjectsUsed: data.quota.arivihanSubjectsUsed || [],
        ownSubjectsUsed: data.quota.ownSubjectsUsed || [],
        arivihanRemaining: data.quota.arivihanRemaining ?? 3,
        ownRemaining: data.quota.ownRemaining ?? 1,
        isLoaded: true,
      });

      // Show warning if fully exhausted
      if (data.isFullyExhausted) {
        setErrorModalContent({
          title: "सीमा समाप्त / Quota Exhausted",
          message: "आपने सभी विषयों की सीमा पूरी कर ली है। / You have exhausted all your submission quota.",
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error checking quota:", error);
      // On network error, use default quota
      setQuota({
        ...initialQuotaState,
        isLoaded: true,
      });
    } finally {
      setIsCheckingQuota(false);
    }
  }, []);

  const handleMobileNumberChange = (value: string) => {
    setMobileNumber(value);
    setErrors((prev) => ({ ...prev, mobileNumber: undefined }));

    // Reset quota when mobile changes
    if (value.length !== 10) {
      setQuota(initialQuotaState);
    }
  };

  const handleMobileBlur = () => {
    // Check quota when both name and mobile are valid
    if (formData.mobileNumber.length === 10 && formData.studentName.trim().length >= 2) {
      checkQuota(formData.studentName, formData.mobileNumber);
    }
  };

  const handleNameBlur = () => {
    // Check quota when both name and mobile are valid
    if (formData.studentName.trim().length >= 2 && formData.mobileNumber.length === 10) {
      checkQuota(formData.studentName, formData.mobileNumber);
    }
  };

  const handleSubmissionTypeChange = (type: SubmissionType) => {
    // Check if this type is exhausted
    if (type === "arivihan_model_paper" && quota.arivihanRemaining === 0) {
      setErrorModalContent({
        title: "सीमा समाप्त / Quota Exhausted",
        message: "आपने पहले ही 3 विषय Arivihan Model Paper के लिए जमा कर दिए हैं। / You have already submitted 3 subjects for Arivihan Model Paper.",
      });
      setShowErrorModal(true);
      return;
    }

    if (type === "own_question_paper" && quota.ownRemaining === 0) {
      setErrorModalContent({
        title: "सीमा समाप्त / Quota Exhausted",
        message: "आपने पहले ही 1 विषय Own Question Paper के लिए जमा कर दिया है। / You have already submitted 1 subject for Own Question Paper.",
      });
      setShowErrorModal(true);
      return;
    }

    if (formData.submissionType && formData.submissionType !== type) {
      if (formData.selectedSubjects.length > 0) {
        if (!confirm(MESSAGES.clearSelection)) {
          return;
        }
      }
    }
    setSubmissionType(type);
    setErrors((prev) => ({ ...prev, submissionType: undefined }));
  };

  const handleAdmitCardFileChange = async (file: File | null) => {
    if (file) {
      // Validate student info is available before upload
      if (!formData.studentName || !formData.mobileNumber || formData.mobileNumber.length !== 10) {
        alert("कृपया पहले नाम और मोबाइल नंबर भरें / Please fill name and mobile number first");
        return;
      }

      setAdmitCardFile(file, "");
      const result = await uploadAdmitCard(file, {
        studentName: formData.studentName,
        mobileNumber: formData.mobileNumber,
      });
      if (result.success && result.fileUrl) {
        setAdmitCardFile(file, result.fileUrl);
      } else {
        alert(result.error || MESSAGES.errors.uploadFailed);
        setAdmitCardFile(null, "");
      }
    } else {
      setAdmitCardFile(null, "");
    }
    setErrors((prev) => ({ ...prev, admitCard: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      const firstErrorElement = document.querySelector("[data-error='true']");
      firstErrorElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const subjectsWithUrls = [];

      for (const subjectCode of formData.selectedSubjects) {
        const subjectFile = formData.subjectFiles[subjectCode];
        if (!subjectFile || subjectFile.files.length === 0) continue;

        const uploadResult = await uploadAnswerSheets(
          subjectFile.files,
          {
            studentName: formData.studentName,
            mobileNumber: formData.mobileNumber,
          },
          {
            subjectCode,
            submissionType: formData.submissionType!,
          },
          (progress) => setSubjectUploadProgress(subjectCode, progress)
        );

        if (!uploadResult.success || uploadResult.fileUrls.length === 0) {
          alert(`Failed to upload files for ${getSubjectByCode(subjectCode)?.nameEn || subjectCode}`);
          setIsSubmitting(false);
          return;
        }

        setSubjectUploadedUrls(subjectCode, uploadResult.fileUrls);

        subjectsWithUrls.push({
          subjectCode,
          fileType: subjectFile.fileType,
          fileUrls: uploadResult.fileUrls,
        });
      }

      const submitResponse = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: formData.studentName,
          mobileNumber: formData.mobileNumber,
          mediumOfStudy: formData.mediumOfStudy,
          admitCardNumber: formData.admitCardNumber || undefined,
          admitCardFileUrl: formData.admitCardFileUrl || undefined,
          submissionType: formData.submissionType,
          subjects: subjectsWithUrls,
        }),
      });

      const submitData: SubmissionResponse = await submitResponse.json();

      if (submitData.success) {
        setSubmissionResult(submitData);
        setShowSuccessModal(true);
      } else {
        // Handle different error types
        setErrorModalContent({
          title: submitData.error === "QUOTA_EXHAUSTED"
            ? "सीमा समाप्त / Quota Exhausted"
            : submitData.error === "DUPLICATE_SUBJECTS"
            ? "विषय पहले से जमा / Subject Already Submitted"
            : submitData.error === "EXCEEDS_QUOTA"
            ? "सीमा से अधिक / Exceeds Quota"
            : "त्रुटि / Error",
          message: submitData.message || MESSAGES.errors.serverError,
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrorModalContent({
        title: "त्रुटि / Error",
        message: MESSAGES.errors.serverError,
      });
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    resetForm();
    setSubmissionResult(null);
    setQuota(initialQuotaState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorModalContent(null);
  };

  const isFormDisabled = isSubmitting || isUploading;

  // Get used subjects based on current submission type
  const usedSubjects = formData.submissionType === "arivihan_model_paper"
    ? quota.arivihanSubjectsUsed
    : quota.ownSubjectsUsed;

  const remainingForType = formData.submissionType === "arivihan_model_paper"
    ? quota.arivihanRemaining
    : quota.ownRemaining;

  return (
    <div className="min-h-screen bg-form-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <FormHeader />
        <FormInstructions />

        <form onSubmit={handleSubmit} className="space-y-4">
          <StudentInfoSection
            studentName={formData.studentName}
            mobileNumber={formData.mobileNumber}
            mediumOfStudy={formData.mediumOfStudy}
            admitCardNumber={formData.admitCardNumber}
            admitCardFile={formData.admitCardFile}
            admitCardFileUrl={formData.admitCardFileUrl}
            errors={errors}
            onStudentNameChange={(v) => {
              setStudentName(v);
              setErrors((prev) => ({ ...prev, studentName: undefined }));
              // Reset quota when name changes
              if (v.trim().length < 2) {
                setQuota(initialQuotaState);
              }
            }}
            onStudentNameBlur={handleNameBlur}
            onMobileNumberChange={handleMobileNumberChange}
            onMobileBlur={handleMobileBlur}
            onMediumOfStudyChange={(v) => {
              setMediumOfStudy(v);
              setErrors((prev) => ({ ...prev, mediumOfStudy: undefined }));
            }}
            onAdmitCardNumberChange={(v) => {
              setAdmitCardNumber(v);
              setErrors((prev) => ({ ...prev, admitCard: undefined }));
            }}
            onAdmitCardFileChange={handleAdmitCardFileChange}
            isUploading={isUploading}
            isCheckingQuota={isCheckingQuota}
          />

          <SubmissionTypeSection
            value={formData.submissionType}
            onChange={handleSubmissionTypeChange}
            error={errors.submissionType}
            disabled={isFormDisabled}
            arivihanRemaining={quota.arivihanRemaining}
            ownRemaining={quota.ownRemaining}
            showQuota={quota.isLoaded}
          />

          {formData.submissionType && (
            <SubjectSelectionSection
              submissionType={formData.submissionType}
              selectedSubjects={formData.selectedSubjects}
              subjectFiles={formData.subjectFiles}
              errors={errors}
              onToggleSubject={(code) => {
                toggleSubject(code);
                setErrors((prev) => ({ ...prev, subjects: undefined }));
              }}
              onSetFileType={setSubjectFileType}
              onAddFiles={addSubjectFiles}
              onRemoveFile={removeSubjectFile}
              disabled={isFormDisabled}
              usedSubjects={usedSubjects}
              remainingQuota={remainingForType}
            />
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isFormDisabled}
              className={`
                w-full py-3 px-6 rounded-md text-white font-medium
                transition-all duration-200
                flex items-center justify-center gap-2
                ${isFormDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-700 hover:bg-primary-800 active:bg-primary-900"
                }
              `}
            >
              {isFormDisabled ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                  {MESSAGES.submitting}
                </>
              ) : (
                MESSAGES.submit
              )}
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={showSuccessModal} onClose={handleSuccessClose}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {MESSAGES.success.title}
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {MESSAGES.success.subtitle}
          </p>

          {submissionResult && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-text-secondary mb-1">
                {MESSAGES.success.submissionIdLabel}
              </p>
              <p className="text-lg font-semibold text-primary-700 mb-3 break-all">
                {submissionResult.studentId}
              </p>

              {submissionResult.subjects && submissionResult.subjects.length > 0 && (
                <>
                  <p className="text-sm text-text-secondary mb-2">
                    इस बार जमा किए गए विषय / Subjects submitted now:
                  </p>
                  <ul className="space-y-1 mb-3">
                    {submissionResult.subjects.map((subject) => (
                      <li key={subject.code} className="text-sm text-text-primary">
                        • {subject.nameHi} ({subject.nameEn})
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {submissionResult.usedQuota && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    कुल जमा विषय / Total Submitted Subjects:
                  </p>

                  {submissionResult.usedQuota.arivihanSubjects.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-text-secondary mb-1">
                        Arivihan Model Paper ({submissionResult.usedQuota.arivihanSubjects.length}/3):
                      </p>
                      <ul className="space-y-0.5 ml-2">
                        {submissionResult.usedQuota.arivihanSubjects.map((subject) => (
                          <li key={subject.code} className="text-xs text-green-700">
                            ✓ {subject.nameHi}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submissionResult.usedQuota.ownSubjects.length > 0 && (
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        Own Question Paper ({submissionResult.usedQuota.ownSubjects.length}/1):
                      </p>
                      <ul className="space-y-0.5 ml-2">
                        {submissionResult.usedQuota.ownSubjects.map((subject) => (
                          <li key={subject.code} className="text-xs text-green-700">
                            ✓ {subject.nameHi}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submissionResult.usedQuota.arivihanSubjects.length === 0 &&
                   submissionResult.usedQuota.ownSubjects.length === 0 && (
                    <p className="text-xs text-text-secondary">कोई विषय नहीं / No subjects yet</p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-text-secondary">
            {MESSAGES.success.thankYou}
          </p>
        </div>
      </Modal>

      <Modal isOpen={showErrorModal} onClose={handleErrorClose}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {errorModalContent?.title || "त्रुटि / Error"}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {errorModalContent?.message || MESSAGES.errors.serverError}
          </p>

          <button
            onClick={handleErrorClose}
            className="w-full py-2.5 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {MESSAGES.close}
          </button>
        </div>
      </Modal>
    </div>
  );
}
