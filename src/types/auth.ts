import { MediumOfStudy } from "./form";

export interface AuthPayload {
  phoneNumber: string;
  authenticatedAt: number;
  exp: number;
  // Teacher-specific fields
  isTeacher?: boolean;
  teacherName?: string;
  teacherSubjects?: string[];
  teacherLanguages?: MediumOfStudy[];
}

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}
