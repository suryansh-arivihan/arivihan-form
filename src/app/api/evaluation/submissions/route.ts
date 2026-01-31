import { NextRequest, NextResponse } from "next/server";
import { getStudentById, scanAllSubmissions } from "@/lib/aws/dynamodb";
import { verifyToken, getCookieName } from "@/lib/auth/jwt";
import { getAssignmentsByTeacher } from "@/lib/aws/assignments";
import { Assignment } from "@/types/teacher";
import { StudentRecord, SubjectSubmission } from "@/types/form";

interface AssignedSubmission {
  assignment: Assignment;
  studentRecord: StudentRecord | null;
  subjectSubmission: SubjectSubmission | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token to check if user is a teacher
    const token = request.cookies.get(getCookieName())?.value;
    const authPayload = token ? await verifyToken(token) : null;

    // If user is a teacher, return only their assigned copies
    if (authPayload?.isTeacher && authPayload.phoneNumber) {
      return await getTeacherAssignments(authPayload.phoneNumber);
    }

    // For non-teachers (admins), return all submissions as before
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const lastKeyParam = searchParams.get("lastKey");

    let lastEvaluatedKey: Record<string, unknown> | undefined;
    if (lastKeyParam) {
      try {
        lastEvaluatedKey = JSON.parse(decodeURIComponent(lastKeyParam));
      } catch {
        return NextResponse.json(
          { error: "Invalid lastKey parameter" },
          { status: 400 }
        );
      }
    }

    const result = await scanAllSubmissions(limit, lastEvaluatedKey);

    return NextResponse.json({
      submissions: result.items,
      nextKey: result.lastEvaluatedKey
        ? encodeURIComponent(JSON.stringify(result.lastEvaluatedKey))
        : null,
      scanned: result.totalScanned,
      isTeacherView: false,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

/**
 * Get assignments for a specific teacher with student details
 */
async function getTeacherAssignments(teacherPhone: string) {
  try {
    // Get all assignments for this teacher
    const assignments = await getAssignmentsByTeacher(teacherPhone);

    // Fetch student details for each assignment
    const assignmentsWithDetails: AssignedSubmission[] = await Promise.all(
      assignments.map(async (assignment) => {
        const studentRecord = await getStudentById(assignment.studentId);

        // Find the specific subject submission
        let subjectSubmission: SubjectSubmission | null = null;
        if (studentRecord) {
          const subjectArray =
            assignment.submissionType === "arivihan"
              ? studentRecord.arivihanSubjects
              : studentRecord.ownSubjects;

          subjectSubmission =
            subjectArray.find(
              (s) => s.subjectCode === assignment.subjectCode
            ) || null;
        }

        return {
          assignment,
          studentRecord,
          subjectSubmission,
        };
      })
    );

    // Transform to a format suitable for the dashboard
    const submissions = assignmentsWithDetails.map((item) => ({
      // Assignment data
      assignmentId: item.assignment.assignmentId,
      assignmentStatus: item.assignment.status,
      assignedAt: item.assignment.assignedAt,
      completedAt: item.assignment.completedAt,
      subjectCode: item.assignment.subjectCode,
      submissionType: item.assignment.submissionType,
      medium: item.assignment.medium,
      // Student data
      studentId: item.assignment.studentId,
      studentName: item.studentRecord?.studentName || "Unknown",
      mobileNumber: item.studentRecord?.mobileNumber || "",
      // Subject submission data
      fileUrls: item.subjectSubmission?.fileUrls || [],
      fileType: item.subjectSubmission?.fileType || "pdf",
      submittedAt: item.subjectSubmission?.submittedAt || item.assignment.assignedAt,
      checkedFileUrl: item.subjectSubmission?.checkedFileUrl,
      checkedAt: item.subjectSubmission?.checkedAt,
      marksObtained: item.subjectSubmission?.marksObtained,
      marksTotal: item.subjectSubmission?.marksTotal,
    }));

    // Sort by status (pending first, then in_progress, then completed) and then by assignedAt
    const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
    submissions.sort((a, b) => {
      const statusDiff =
        statusOrder[a.assignmentStatus] - statusOrder[b.assignmentStatus];
      if (statusDiff !== 0) return statusDiff;
      return (
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
      );
    });

    // Calculate counts
    const pendingCount = submissions.filter(
      (s) => s.assignmentStatus === "pending"
    ).length;
    const inProgressCount = submissions.filter(
      (s) => s.assignmentStatus === "in_progress"
    ).length;
    const completedCount = submissions.filter(
      (s) => s.assignmentStatus === "completed"
    ).length;

    return NextResponse.json({
      submissions,
      isTeacherView: true,
      counts: {
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        total: submissions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
