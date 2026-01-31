import { MediumOfStudy } from "./form";

// Teacher record in DynamoDB
export interface Teacher {
  phoneNumber: string; // Primary key
  name: string;
  languages: MediumOfStudy[]; // ["hindi"], ["english"], or both
  subjects: string[]; // Subject codes they can evaluate
  isActive: boolean;
  pendingCount: number; // Current pending assignments (for load balancing)
  totalEvaluated: number; // Lifetime count
  onboardedAt: string; // ISO timestamp
}

// Assignment status
export type AssignmentStatus = "pending" | "in_progress" | "completed";

// Submission type for assignments
export type AssignmentSubmissionType = "arivihan" | "own";

// Assignment record in DynamoDB
export interface Assignment {
  assignmentId: string; // Primary key (UUID)
  studentId: string; // Links to submissions table
  subjectCode: string; // e.g., "physics"
  submissionType: AssignmentSubmissionType; // "arivihan" | "own"
  medium: MediumOfStudy; // "hindi" | "english"
  teacherPhone: string; // Assigned teacher (GSI1-PK)
  status: AssignmentStatus; // "pending" | "in_progress" | "completed" (GSI1-SK)
  assignedAt: string; // ISO timestamp
  completedAt?: string; // When marked complete
}

// Extended auth payload with teacher info
export interface TeacherAuthInfo {
  isTeacher: boolean;
  teacherName?: string;
  teacherPhone?: string;
  teacherSubjects?: string[];
  teacherLanguages?: MediumOfStudy[];
}

// Assignment with student details for dashboard display
export interface AssignmentWithStudent extends Assignment {
  studentName?: string;
  studentMobile?: string;
  fileUrls?: string[];
  checkedFileUrl?: string;
}
