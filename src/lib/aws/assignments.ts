import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import {
  Assignment,
  AssignmentStatus,
  AssignmentSubmissionType,
  Teacher,
} from "@/types/teacher";
import { MediumOfStudy } from "@/types/form";
import { getAllActiveTeachers } from "./teachers";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.DYNAMODB_ASSIGNMENTS_TABLE || "arivihan-assignments";
const GSI_NAME = "teacherPhone-status-index";

/**
 * Create a new assignment
 */
export async function createAssignment(data: {
  studentId: string;
  subjectCode: string;
  submissionType: AssignmentSubmissionType;
  medium: MediumOfStudy;
  teacherPhone: string;
}): Promise<Assignment> {
  const now = new Date().toISOString();
  const assignment: Assignment = {
    assignmentId: randomUUID(),
    studentId: data.studentId,
    subjectCode: data.subjectCode,
    submissionType: data.submissionType,
    medium: data.medium,
    teacherPhone: data.teacherPhone,
    status: "pending",
    assignedAt: now,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: assignment,
  });

  await docClient.send(command);
  return assignment;
}

/**
 * Get assignment by ID
 */
export async function getAssignmentById(
  assignmentId: string
): Promise<Assignment | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { assignmentId },
  });

  const response = await docClient.send(command);
  return response.Item ? (response.Item as Assignment) : null;
}

/**
 * Get assignments by teacher phone using GSI
 * Optionally filter by status
 */
export async function getAssignmentsByTeacher(
  teacherPhone: string,
  status?: AssignmentStatus
): Promise<Assignment[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI_NAME,
    KeyConditionExpression: status
      ? "teacherPhone = :phone AND #status = :status"
      : "teacherPhone = :phone",
    ExpressionAttributeValues: status
      ? {
          ":phone": teacherPhone,
          ":status": status,
        }
      : {
          ":phone": teacherPhone,
        },
    ...(status && {
      ExpressionAttributeNames: {
        "#status": "status",
      },
    }),
  });

  const response = await docClient.send(command);
  return (response.Items || []) as Assignment[];
}

/**
 * Get assignment for a specific student, subject, and submission type
 */
export async function getAssignmentByStudentSubject(
  studentId: string,
  subjectCode: string,
  submissionType: AssignmentSubmissionType
): Promise<Assignment | null> {
  // Since we don't have a GSI on studentId, we scan with filter
  // This is acceptable as this operation is not frequent
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression:
      "studentId = :studentId AND subjectCode = :subjectCode AND submissionType = :type",
    ExpressionAttributeValues: {
      ":studentId": studentId,
      ":subjectCode": subjectCode,
      ":type": submissionType,
    },
  });

  const response = await docClient.send(command);
  return response.Items && response.Items.length > 0
    ? (response.Items[0] as Assignment)
    : null;
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus
): Promise<Assignment | null> {
  const updateExpr =
    status === "completed"
      ? "SET #status = :status, completedAt = :now"
      : "SET #status = :status";

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { assignmentId },
    UpdateExpression: updateExpr,
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues:
      status === "completed"
        ? {
            ":status": status,
            ":now": new Date().toISOString(),
          }
        : {
            ":status": status,
          },
    ReturnValues: "ALL_NEW",
  });

  try {
    const response = await docClient.send(command);
    return response.Attributes as Assignment;
  } catch {
    return null;
  }
}

/**
 * Find eligible teacher with lowest pending load
 * Returns teacher who:
 * 1. Has the subject in their subjects list
 * 2. Has the medium in their languages list
 * 3. Is active
 * 4. Has the lowest pendingCount
 */
export async function findEligibleTeacher(
  subjectCode: string,
  medium: MediumOfStudy
): Promise<Teacher | null> {
  const activeTeachers = await getAllActiveTeachers();

  // Filter teachers who can evaluate this subject and medium
  const eligibleTeachers = activeTeachers.filter(
    (teacher) =>
      teacher.subjects.includes(subjectCode) &&
      teacher.languages.includes(medium)
  );

  if (eligibleTeachers.length === 0) {
    return null;
  }

  // Sort by pendingCount (ascending) and pick the one with lowest load
  eligibleTeachers.sort((a, b) => a.pendingCount - b.pendingCount);

  return eligibleTeachers[0];
}

/**
 * Get all assignments for a student
 */
export async function getAssignmentsByStudent(
  studentId: string
): Promise<Assignment[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "studentId = :studentId",
    ExpressionAttributeValues: {
      ":studentId": studentId,
    },
  });

  const response = await docClient.send(command);
  return (response.Items || []) as Assignment[];
}

/**
 * Get pending and in_progress assignments count for a teacher
 */
export async function getTeacherActiveAssignmentsCount(
  teacherPhone: string
): Promise<{ pending: number; inProgress: number }> {
  const pendingAssignments = await getAssignmentsByTeacher(
    teacherPhone,
    "pending"
  );
  const inProgressAssignments = await getAssignmentsByTeacher(
    teacherPhone,
    "in_progress"
  );

  return {
    pending: pendingAssignments.length,
    inProgress: inProgressAssignments.length,
  };
}
