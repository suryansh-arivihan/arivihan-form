import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSubmissionQuota,
  upsertStudentSubmission,
  generateStudentId,
} from "@/lib/aws/dynamodb";
import { formatDate } from "@/lib/utils/submission-id";
import { getSubjectByCode } from "@/constants/subjects";
import {
  autoAssignSubmission,
  toAssignmentSubmissionType,
} from "@/lib/services/assignment-service";

const submitSchema = z.object({
  studentName: z.string().min(2).max(100),
  mobileNumber: z.string().regex(/^\d{10}$/),
  mediumOfStudy: z.enum(["hindi", "english"]),
  admitCardNumber: z.string().optional(),
  admitCardFileUrl: z.string().url().optional(),
  submissionType: z.enum(["arivihan_model_paper", "own_question_paper"]),
  subjects: z.array(
    z.object({
      subjectCode: z.string(),
      fileType: z.enum(["pdf", "images"]),
      fileUrls: z.array(z.string().url()).min(1),
    })
  ).min(1),
}).refine(
  (data) => data.admitCardNumber || data.admitCardFileUrl,
  { message: "Either admit card number or file is required" }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check quota and already submitted subjects
    const quota = await getSubmissionQuota(data.studentName, data.mobileNumber);

    const isArivihan = data.submissionType === "arivihan_model_paper";
    const usedSubjects = isArivihan ? quota.arivihanSubjectsUsed : quota.ownSubjectsUsed;
    const remaining = isArivihan ? quota.arivihanRemaining : quota.ownRemaining;

    // Check if quota is exhausted for this submission type
    if (remaining === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "QUOTA_EXHAUSTED",
          message: isArivihan
            ? "आपने पहले ही 3 विषय जमा कर दिए हैं / You have already submitted 3 subjects for Arivihan Model Paper"
            : "आपने पहले ही 1 विषय जमा कर दिया है / You have already submitted 1 subject for Own Question Paper",
          quota: {
            arivihanSubjectsUsed: quota.arivihanSubjectsUsed,
            ownSubjectsUsed: quota.ownSubjectsUsed,
            arivihanRemaining: quota.arivihanRemaining,
            ownRemaining: quota.ownRemaining,
          },
        },
        { status: 409 }
      );
    }

    // Check if any submitted subjects are already submitted
    const duplicateSubjects = data.subjects
      .map((s) => s.subjectCode)
      .filter((code) => usedSubjects.includes(code));

    if (duplicateSubjects.length > 0) {
      const duplicateNames = duplicateSubjects.map((code) => {
        const subject = getSubjectByCode(code);
        return subject ? `${subject.nameHi} (${subject.nameEn})` : code;
      });

      return NextResponse.json(
        {
          success: false,
          error: "DUPLICATE_SUBJECTS",
          message: `ये विषय पहले से जमा हो चुके हैं / These subjects are already submitted: ${duplicateNames.join(", ")}`,
          duplicateSubjects,
        },
        { status: 409 }
      );
    }

    // Check if submission exceeds remaining quota
    if (data.subjects.length > remaining) {
      return NextResponse.json(
        {
          success: false,
          error: "EXCEEDS_QUOTA",
          message: `आप केवल ${remaining} और विषय जमा कर सकते हैं / You can only submit ${remaining} more subject(s)`,
          remaining,
        },
        { status: 409 }
      );
    }

    // Create or update student record with new subjects
    const studentRecord = await upsertStudentSubmission(
      data.studentName,
      data.mobileNumber,
      data.mediumOfStudy,
      data.submissionType,
      data.subjects,
      data.admitCardNumber,
      data.admitCardFileUrl
    );

    // The studentId is same as S3 folder name
    const studentId = generateStudentId(data.studentName, data.mobileNumber);

    // Auto-assign submission to teachers
    try {
      const assignmentResult = await autoAssignSubmission(
        studentId,
        data.mediumOfStudy,
        toAssignmentSubmissionType(data.submissionType),
        data.subjects.map((s) => ({ subjectCode: s.subjectCode }))
      );
      console.log(
        `[Submit] Auto-assignment result: ${assignmentResult.assigned} assigned, ${assignmentResult.failed} failed`
      );
    } catch (assignmentError) {
      // Log but don't fail the submission if assignment fails
      console.error("[Submit] Auto-assignment error:", assignmentError);
    }

    const submittedSubjects = data.subjects.map((s) => {
      const subject = getSubjectByCode(s.subjectCode);
      return {
        code: s.subjectCode,
        nameEn: subject?.nameEn || s.subjectCode,
        nameHi: subject?.nameHi || s.subjectCode,
      };
    });

    // Build used quota summary with full subject details
    const arivihanUsedSubjects = studentRecord.arivihanSubjects.map((s) => {
      const subject = getSubjectByCode(s.subjectCode);
      return {
        code: s.subjectCode,
        nameEn: subject?.nameEn || s.subjectCode,
        nameHi: subject?.nameHi || s.subjectCode,
      };
    });

    const ownUsedSubjects = studentRecord.ownSubjects.map((s) => {
      const subject = getSubjectByCode(s.subjectCode);
      return {
        code: s.subjectCode,
        nameEn: subject?.nameEn || s.subjectCode,
        nameHi: subject?.nameHi || s.subjectCode,
      };
    });

    return NextResponse.json({
      success: true,
      studentId,
      createdAt: formatDate(studentRecord.updatedAt),
      subjects: submittedSubjects,
      usedQuota: {
        arivihanSubjects: arivihanUsedSubjects,
        ownSubjects: ownUsedSubjects,
      },
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
