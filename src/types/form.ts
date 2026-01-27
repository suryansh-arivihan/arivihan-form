export type SubmissionType = "arivihan_model_paper" | "own_question_paper";

export type MediumOfStudy = "hindi" | "english";

export type FileUploadType = "pdf" | "images";

export interface Subject {
  code: string;
  nameEn: string;
  nameHi: string;
}

export interface SubjectFile {
  subjectCode: string;
  fileType: FileUploadType;
  files: File[];
  uploadProgress: number;
  uploadedUrls: string[];
  error?: string;
}

export interface FormData {
  studentName: string;
  mobileNumber: string;
  mediumOfStudy: MediumOfStudy | null;
  admitCardNumber: string;
  admitCardFile: File | null;
  admitCardFileUrl: string;
  submissionType: SubmissionType | null;
  selectedSubjects: string[];
  subjectFiles: Record<string, SubjectFile>;
}

export interface FormErrors {
  studentName?: string;
  mobileNumber?: string;
  mediumOfStudy?: string;
  admitCard?: string;
  submissionType?: string;
  subjects?: string;
  subjectFiles?: Record<string, string>;
}

export interface SubmissionPayload {
  studentName: string;
  mobileNumber: string;
  mediumOfStudy: MediumOfStudy;
  admitCardNumber?: string;
  admitCardFileUrl?: string;
  submissionType: SubmissionType;
  subjects: {
    subjectCode: string;
    fileType: FileUploadType;
    fileUrls: string[];
  }[];
}

export interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  createdAt?: string;
  subjects?: {
    code: string;
    nameEn: string;
    nameHi: string;
  }[];
  error?: string;
  message?: string;
  remainingQuota?: {
    arivihanRemaining: number;
    ownRemaining: number;
  };
  quota?: {
    arivihanSubjectsUsed: string[];
    ownSubjectsUsed: string[];
    arivihanRemaining: number;
    ownRemaining: number;
  };
  duplicateSubjects?: string[];
}

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  folder: "admit-cards" | "answer-sheets";
  subjectCode?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export interface QuotaCheckResponse {
  quota: {
    arivihanSubjectsUsed: string[];
    ownSubjectsUsed: string[];
    arivihanRemaining: number;
    ownRemaining: number;
  };
  isArivihanExhausted: boolean;
  isOwnExhausted: boolean;
  isFullyExhausted: boolean;
}

export type FormAction =
  | { type: "SET_STUDENT_NAME"; payload: string }
  | { type: "SET_MOBILE_NUMBER"; payload: string }
  | { type: "SET_MEDIUM_OF_STUDY"; payload: MediumOfStudy }
  | { type: "SET_ADMIT_CARD_NUMBER"; payload: string }
  | { type: "SET_ADMIT_CARD_FILE"; payload: { file: File | null; url: string } }
  | { type: "SET_SUBMISSION_TYPE"; payload: SubmissionType }
  | { type: "TOGGLE_SUBJECT"; payload: string }
  | { type: "SET_SUBJECT_FILE_TYPE"; payload: { subjectCode: string; fileType: FileUploadType } }
  | { type: "ADD_SUBJECT_FILES"; payload: { subjectCode: string; files: File[] } }
  | { type: "REMOVE_SUBJECT_FILE"; payload: { subjectCode: string; fileIndex: number } }
  | { type: "SET_SUBJECT_UPLOAD_PROGRESS"; payload: { subjectCode: string; progress: number } }
  | { type: "SET_SUBJECT_UPLOADED_URLS"; payload: { subjectCode: string; urls: string[] } }
  | { type: "SET_SUBJECT_ERROR"; payload: { subjectCode: string; error: string } }
  | { type: "CLEAR_SUBJECT_ERROR"; payload: string }
  | { type: "RESET_FORM" }
  | { type: "SET_ERRORS"; payload: FormErrors }
  | { type: "CLEAR_ERRORS" };
