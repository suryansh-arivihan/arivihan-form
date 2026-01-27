import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { generateStudentFolder } from "@/lib/utils/file-naming";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "arivihan-form-submissions";

// Subject submission within a record
export interface SubjectSubmission {
  subjectCode: string;
  fileType: "pdf" | "images";
  fileUrls: string[];
  submittedAt: string;
}

// Single record per student
export interface StudentRecord {
  studentId: string;  // Primary key: {sanitized_name}_{mobile} - same as S3 folder
  studentName: string;
  mobileNumber: string;
  mediumOfStudy: "hindi" | "english";
  admitCardNumber?: string;
  admitCardFileUrl?: string;
  arivihanSubjects: SubjectSubmission[];  // Up to 3 subjects for Arivihan Model Paper
  ownSubjects: SubjectSubmission[];       // Up to 1 subject for Own Question Paper
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate student ID from name and mobile (same as S3 folder name)
 */
export function generateStudentId(studentName: string, mobileNumber: string): string {
  return generateStudentFolder(studentName, mobileNumber);
}

/**
 * Get student record by ID
 */
export async function getStudentById(studentId: string): Promise<StudentRecord | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { studentId },
  });

  const response = await docClient.send(command);
  return response.Item ? (response.Item as StudentRecord) : null;
}

/**
 * Get student record by name and mobile
 */
export async function getStudentByNameAndMobile(
  studentName: string,
  mobileNumber: string
): Promise<StudentRecord | null> {
  const studentId = generateStudentId(studentName, mobileNumber);
  return getStudentById(studentId);
}

/**
 * Create a new student record
 */
export async function createStudentRecord(
  studentName: string,
  mobileNumber: string,
  mediumOfStudy: "hindi" | "english",
  admitCardNumber?: string,
  admitCardFileUrl?: string
): Promise<StudentRecord> {
  const studentId = generateStudentId(studentName, mobileNumber);
  const now = new Date().toISOString();

  const record: StudentRecord = {
    studentId,
    studentName,
    mobileNumber,
    mediumOfStudy,
    admitCardNumber,
    admitCardFileUrl,
    arivihanSubjects: [],
    ownSubjects: [],
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: record,
    ConditionExpression: "attribute_not_exists(studentId)",
  });

  await docClient.send(command);
  return record;
}

/**
 * Add subjects to an existing student record
 */
export async function addSubjectsToStudent(
  studentId: string,
  submissionType: "arivihan_model_paper" | "own_question_paper",
  subjects: { subjectCode: string; fileType: "pdf" | "images"; fileUrls: string[] }[],
  admitCardNumber?: string,
  admitCardFileUrl?: string
): Promise<StudentRecord> {
  const now = new Date().toISOString();
  const subjectField = submissionType === "arivihan_model_paper" ? "arivihanSubjects" : "ownSubjects";

  const newSubjects: SubjectSubmission[] = subjects.map((s) => ({
    subjectCode: s.subjectCode,
    fileType: s.fileType,
    fileUrls: s.fileUrls,
    submittedAt: now,
  }));

  // Build update expression
  let updateExpression = `SET #subjects = list_append(if_not_exists(#subjects, :empty), :newSubjects), updatedAt = :now`;
  const expressionAttributeNames: Record<string, string> = {
    "#subjects": subjectField,
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ":newSubjects": newSubjects,
    ":empty": [],
    ":now": now,
  };

  // Update admit card info if provided
  if (admitCardNumber) {
    updateExpression += ", admitCardNumber = :admitCardNumber";
    expressionAttributeValues[":admitCardNumber"] = admitCardNumber;
  }
  if (admitCardFileUrl) {
    updateExpression += ", admitCardFileUrl = :admitCardFileUrl";
    expressionAttributeValues[":admitCardFileUrl"] = admitCardFileUrl;
  }

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { studentId },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(command);
  return response.Attributes as StudentRecord;
}

/**
 * Create or update student record with new subjects
 * This is the main function for submissions - handles both new and existing students
 */
export async function upsertStudentSubmission(
  studentName: string,
  mobileNumber: string,
  mediumOfStudy: "hindi" | "english",
  submissionType: "arivihan_model_paper" | "own_question_paper",
  subjects: { subjectCode: string; fileType: "pdf" | "images"; fileUrls: string[] }[],
  admitCardNumber?: string,
  admitCardFileUrl?: string
): Promise<StudentRecord> {
  const studentId = generateStudentId(studentName, mobileNumber);

  // Check if student exists
  const existingStudent = await getStudentById(studentId);

  if (!existingStudent) {
    // Create new student record
    const record = await createStudentRecord(
      studentName,
      mobileNumber,
      mediumOfStudy,
      admitCardNumber,
      admitCardFileUrl
    );

    // Add subjects to the newly created record
    return addSubjectsToStudent(studentId, submissionType, subjects);
  }

  // Update existing student with new subjects
  return addSubjectsToStudent(
    studentId,
    submissionType,
    subjects,
    admitCardNumber,
    admitCardFileUrl
  );
}

export interface SubmissionQuota {
  arivihanSubjectsUsed: string[];
  ownSubjectsUsed: string[];
  arivihanRemaining: number;
  ownRemaining: number;
}

/**
 * Get submission quota for a student by mobile number
 * Note: This now looks up by studentId pattern matching since we don't have GSI
 */
export async function getSubmissionQuotaByMobile(
  mobileNumber: string
): Promise<SubmissionQuota> {
  // Default quota if no record found
  const defaultQuota: SubmissionQuota = {
    arivihanSubjectsUsed: [],
    ownSubjectsUsed: [],
    arivihanRemaining: 3,
    ownRemaining: 1,
  };

  // We need to find the student record. Since we use name+mobile as ID,
  // and we only have mobile here, we'll use the GSI on mobileNumber
  // For now, return default - the actual check happens during submission
  // when we have both name and mobile
  return defaultQuota;
}

/**
 * Get submission quota for a student by name and mobile
 */
export async function getSubmissionQuota(
  studentName: string,
  mobileNumber: string
): Promise<SubmissionQuota> {
  const student = await getStudentByNameAndMobile(studentName, mobileNumber);

  if (!student) {
    return {
      arivihanSubjectsUsed: [],
      ownSubjectsUsed: [],
      arivihanRemaining: 3,
      ownRemaining: 1,
    };
  }

  const arivihanSubjects = student.arivihanSubjects.map((s) => s.subjectCode);
  const ownSubjects = student.ownSubjects.map((s) => s.subjectCode);

  return {
    arivihanSubjectsUsed: arivihanSubjects,
    ownSubjectsUsed: ownSubjects,
    arivihanRemaining: Math.max(0, 3 - arivihanSubjects.length),
    ownRemaining: Math.max(0, 1 - ownSubjects.length),
  };
}

export interface PaginatedResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
  totalScanned: number;
}

/**
 * Scan all student submissions with optional pagination
 */
export async function scanAllSubmissions(
  limit: number = 25,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedResult<StudentRecord>> {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  });

  const response = await docClient.send(command);

  return {
    items: (response.Items || []) as StudentRecord[],
    lastEvaluatedKey: response.LastEvaluatedKey,
    totalScanned: response.ScannedCount || 0,
  };
}
