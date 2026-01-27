"use client";

import { useReducer, useCallback } from "react";
import {
  FormData,
  FormErrors,
  FormAction,
  SubmissionType,
  MediumOfStudy,
  FileUploadType,
  SubjectFile,
} from "@/types/form";
import { MAX_SUBJECTS_ARIVIHAN, MAX_SUBJECTS_OWN } from "@/constants/subjects";

const initialFormData: FormData = {
  studentName: "",
  mobileNumber: "",
  mediumOfStudy: null,
  admitCardNumber: "",
  admitCardFile: null,
  admitCardFileUrl: "",
  submissionType: null,
  selectedSubjects: [],
  subjectFiles: {},
};

function createEmptySubjectFile(subjectCode: string): SubjectFile {
  return {
    subjectCode,
    fileType: "images",
    files: [],
    uploadProgress: 0,
    uploadedUrls: [],
  };
}

function formReducer(state: FormData, action: FormAction): FormData {
  switch (action.type) {
    case "SET_STUDENT_NAME":
      return { ...state, studentName: action.payload };

    case "SET_MOBILE_NUMBER":
      return { ...state, mobileNumber: action.payload };

    case "SET_MEDIUM_OF_STUDY":
      return { ...state, mediumOfStudy: action.payload };

    case "SET_ADMIT_CARD_NUMBER":
      return { ...state, admitCardNumber: action.payload };

    case "SET_ADMIT_CARD_FILE":
      return {
        ...state,
        admitCardFile: action.payload.file,
        admitCardFileUrl: action.payload.url,
      };

    case "SET_SUBMISSION_TYPE":
      if (state.submissionType === action.payload) {
        return state;
      }
      return {
        ...state,
        submissionType: action.payload,
        selectedSubjects: [],
        subjectFiles: {},
      };

    case "TOGGLE_SUBJECT": {
      const subjectCode = action.payload;
      const isSelected = state.selectedSubjects.includes(subjectCode);

      if (isSelected) {
        const newSubjectFiles = { ...state.subjectFiles };
        delete newSubjectFiles[subjectCode];
        return {
          ...state,
          selectedSubjects: state.selectedSubjects.filter((s) => s !== subjectCode),
          subjectFiles: newSubjectFiles,
        };
      }

      const maxSubjects = state.submissionType === "arivihan_model_paper"
        ? MAX_SUBJECTS_ARIVIHAN
        : MAX_SUBJECTS_OWN;

      if (state.selectedSubjects.length >= maxSubjects) {
        return state;
      }

      return {
        ...state,
        selectedSubjects: [...state.selectedSubjects, subjectCode],
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: createEmptySubjectFile(subjectCode),
        },
      };
    }

    case "SET_SUBJECT_FILE_TYPE": {
      const { subjectCode, fileType } = action.payload;
      const existing = state.subjectFiles[subjectCode] || createEmptySubjectFile(subjectCode);
      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            fileType,
            files: [],
            uploadedUrls: [],
            uploadProgress: 0,
          },
        },
      };
    }

    case "ADD_SUBJECT_FILES": {
      const { subjectCode, files } = action.payload;
      const existing = state.subjectFiles[subjectCode] || createEmptySubjectFile(subjectCode);
      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            files: existing.fileType === "pdf" ? files : [...existing.files, ...files],
          },
        },
      };
    }

    case "REMOVE_SUBJECT_FILE": {
      const { subjectCode, fileIndex } = action.payload;
      const existing = state.subjectFiles[subjectCode];
      if (!existing) return state;

      const newFiles = existing.files.filter((_, i) => i !== fileIndex);
      const newUrls = existing.uploadedUrls.filter((_, i) => i !== fileIndex);

      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            files: newFiles,
            uploadedUrls: newUrls,
          },
        },
      };
    }

    case "SET_SUBJECT_UPLOAD_PROGRESS": {
      const { subjectCode, progress } = action.payload;
      const existing = state.subjectFiles[subjectCode];
      if (!existing) return state;

      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            uploadProgress: progress,
          },
        },
      };
    }

    case "SET_SUBJECT_UPLOADED_URLS": {
      const { subjectCode, urls } = action.payload;
      const existing = state.subjectFiles[subjectCode];
      if (!existing) return state;

      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            uploadedUrls: urls,
            uploadProgress: 100,
          },
        },
      };
    }

    case "SET_SUBJECT_ERROR": {
      const { subjectCode, error } = action.payload;
      const existing = state.subjectFiles[subjectCode];
      if (!existing) return state;

      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            error,
          },
        },
      };
    }

    case "CLEAR_SUBJECT_ERROR": {
      const subjectCode = action.payload;
      const existing = state.subjectFiles[subjectCode];
      if (!existing) return state;

      return {
        ...state,
        subjectFiles: {
          ...state.subjectFiles,
          [subjectCode]: {
            ...existing,
            error: undefined,
          },
        },
      };
    }

    case "RESET_FORM":
      return initialFormData;

    default:
      return state;
  }
}

export function useFormState() {
  const [formData, dispatch] = useReducer(formReducer, initialFormData);

  const setStudentName = useCallback((value: string) => {
    dispatch({ type: "SET_STUDENT_NAME", payload: value });
  }, []);

  const setMobileNumber = useCallback((value: string) => {
    dispatch({ type: "SET_MOBILE_NUMBER", payload: value });
  }, []);

  const setMediumOfStudy = useCallback((value: MediumOfStudy) => {
    dispatch({ type: "SET_MEDIUM_OF_STUDY", payload: value });
  }, []);

  const setAdmitCardNumber = useCallback((value: string) => {
    dispatch({ type: "SET_ADMIT_CARD_NUMBER", payload: value });
  }, []);

  const setAdmitCardFile = useCallback((file: File | null, url: string = "") => {
    dispatch({ type: "SET_ADMIT_CARD_FILE", payload: { file, url } });
  }, []);

  const setSubmissionType = useCallback((type: SubmissionType) => {
    dispatch({ type: "SET_SUBMISSION_TYPE", payload: type });
  }, []);

  const toggleSubject = useCallback((subjectCode: string) => {
    dispatch({ type: "TOGGLE_SUBJECT", payload: subjectCode });
  }, []);

  const setSubjectFileType = useCallback((subjectCode: string, fileType: FileUploadType) => {
    dispatch({ type: "SET_SUBJECT_FILE_TYPE", payload: { subjectCode, fileType } });
  }, []);

  const addSubjectFiles = useCallback((subjectCode: string, files: File[]) => {
    dispatch({ type: "ADD_SUBJECT_FILES", payload: { subjectCode, files } });
  }, []);

  const removeSubjectFile = useCallback((subjectCode: string, fileIndex: number) => {
    dispatch({ type: "REMOVE_SUBJECT_FILE", payload: { subjectCode, fileIndex } });
  }, []);

  const setSubjectUploadProgress = useCallback((subjectCode: string, progress: number) => {
    dispatch({ type: "SET_SUBJECT_UPLOAD_PROGRESS", payload: { subjectCode, progress } });
  }, []);

  const setSubjectUploadedUrls = useCallback((subjectCode: string, urls: string[]) => {
    dispatch({ type: "SET_SUBJECT_UPLOADED_URLS", payload: { subjectCode, urls } });
  }, []);

  const setSubjectError = useCallback((subjectCode: string, error: string) => {
    dispatch({ type: "SET_SUBJECT_ERROR", payload: { subjectCode, error } });
  }, []);

  const clearSubjectError = useCallback((subjectCode: string) => {
    dispatch({ type: "CLEAR_SUBJECT_ERROR", payload: subjectCode });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM" });
  }, []);

  return {
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
    setSubjectError,
    clearSubjectError,
    resetForm,
  };
}
