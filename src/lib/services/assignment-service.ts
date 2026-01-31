import { MediumOfStudy } from "@/types/form";
import { AssignmentSubmissionType } from "@/types/teacher";
import {
  createAssignment,
  findEligibleTeacher,
  getAssignmentByStudentSubject,
} from "@/lib/aws/assignments";
import { updateTeacherPendingCount } from "@/lib/aws/teachers";

interface SubjectToAssign {
  subjectCode: string;
}

/**
 * Auto-assign a submission to eligible teachers
 * Called after a student successfully submits their copy
 */
export async function autoAssignSubmission(
  studentId: string,
  medium: MediumOfStudy,
  submissionType: AssignmentSubmissionType,
  subjects: SubjectToAssign[]
): Promise<{
  assigned: number;
  failed: number;
  assignments: Array<{
    subjectCode: string;
    teacherPhone: string | null;
    success: boolean;
    error?: string;
  }>;
}> {
  const results: Array<{
    subjectCode: string;
    teacherPhone: string | null;
    success: boolean;
    error?: string;
  }> = [];

  let assigned = 0;
  let failed = 0;

  for (const subject of subjects) {
    try {
      // Check if assignment already exists for this subject
      const existingAssignment = await getAssignmentByStudentSubject(
        studentId,
        subject.subjectCode,
        submissionType
      );

      if (existingAssignment) {
        console.log(
          `[Assignment] Skipping ${subject.subjectCode} - already assigned to ${existingAssignment.teacherPhone}`
        );
        results.push({
          subjectCode: subject.subjectCode,
          teacherPhone: existingAssignment.teacherPhone,
          success: true,
          error: "Already assigned",
        });
        continue;
      }

      // Find eligible teacher with lowest load
      const teacher = await findEligibleTeacher(subject.subjectCode, medium);

      if (!teacher) {
        console.warn(
          `[Assignment] No eligible teacher found for ${subject.subjectCode} (${medium})`
        );
        results.push({
          subjectCode: subject.subjectCode,
          teacherPhone: null,
          success: false,
          error: "No eligible teacher found",
        });
        failed++;
        continue;
      }

      // Create assignment
      const assignment = await createAssignment({
        studentId,
        subjectCode: subject.subjectCode,
        submissionType,
        medium,
        teacherPhone: teacher.phoneNumber,
      });

      // Increment teacher's pending count
      await updateTeacherPendingCount(teacher.phoneNumber, 1);

      console.log(
        `[Assignment] Assigned ${subject.subjectCode} to ${teacher.name} (${teacher.phoneNumber})`
      );

      results.push({
        subjectCode: subject.subjectCode,
        teacherPhone: teacher.phoneNumber,
        success: true,
      });
      assigned++;
    } catch (error) {
      console.error(
        `[Assignment] Error assigning ${subject.subjectCode}:`,
        error
      );
      results.push({
        subjectCode: subject.subjectCode,
        teacherPhone: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failed++;
    }
  }

  return { assigned, failed, assignments: results };
}

/**
 * Convert submission type from form format to assignment format
 */
export function toAssignmentSubmissionType(
  formType: "arivihan_model_paper" | "own_question_paper"
): AssignmentSubmissionType {
  return formType === "arivihan_model_paper" ? "arivihan" : "own";
}
