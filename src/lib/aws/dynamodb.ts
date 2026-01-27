import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "arivihan-form-submissions";

export interface SubmissionRecord {
  submissionId: string;
  studentName: string;
  mobileNumber: string;
  mediumOfStudy: "hindi" | "english";
  admitCardNumber?: string;
  admitCardFileUrl?: string;
  submissionType: "arivihan_model_paper" | "own_question_paper";
  subjects: {
    subjectCode: string;
    fileType: "pdf" | "images";
    fileUrls: string[];
  }[];
  createdAt: string;
  status: "pending" | "processing" | "completed";
}

export async function createSubmission(
  submission: SubmissionRecord
): Promise<void> {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: submission,
    ConditionExpression: "attribute_not_exists(submissionId)",
  });

  await docClient.send(command);
}

export async function getSubmissionByMobile(
  mobileNumber: string
): Promise<SubmissionRecord | null> {
  const submissions = await getAllSubmissionsByMobile(mobileNumber);
  return submissions.length > 0 ? submissions[0] : null;
}

export async function getAllSubmissionsByMobile(
  mobileNumber: string
): Promise<SubmissionRecord[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "mobile-index",
    KeyConditionExpression: "mobileNumber = :mobile",
    ExpressionAttributeValues: {
      ":mobile": mobileNumber,
    },
  });

  const response = await docClient.send(command);

  if (response.Items && response.Items.length > 0) {
    return response.Items as SubmissionRecord[];
  }

  return [];
}

export interface SubmissionQuota {
  arivihanSubjectsUsed: string[];
  ownSubjectsUsed: string[];
  arivihanRemaining: number;
  ownRemaining: number;
}

export async function getSubmissionQuota(
  mobileNumber: string
): Promise<SubmissionQuota> {
  const submissions = await getAllSubmissionsByMobile(mobileNumber);

  const arivihanSubjects: string[] = [];
  const ownSubjects: string[] = [];

  for (const submission of submissions) {
    for (const subject of submission.subjects) {
      if (submission.submissionType === "arivihan_model_paper") {
        if (!arivihanSubjects.includes(subject.subjectCode)) {
          arivihanSubjects.push(subject.subjectCode);
        }
      } else {
        if (!ownSubjects.includes(subject.subjectCode)) {
          ownSubjects.push(subject.subjectCode);
        }
      }
    }
  }

  return {
    arivihanSubjectsUsed: arivihanSubjects,
    ownSubjectsUsed: ownSubjects,
    arivihanRemaining: Math.max(0, 3 - arivihanSubjects.length),
    ownRemaining: Math.max(0, 1 - ownSubjects.length),
  };
}

export async function getSubmissionById(
  submissionId: string
): Promise<SubmissionRecord | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { submissionId },
  });

  const response = await docClient.send(command);

  if (response.Item) {
    return response.Item as SubmissionRecord;
  }

  return null;
}

export async function getNextSubmissionCounter(): Promise<number> {
  const year = new Date().getFullYear();
  const counterKey = `COUNTER-${year}`;

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { submissionId: counterKey },
    UpdateExpression: "SET #counter = if_not_exists(#counter, :start) + :inc",
    ExpressionAttributeNames: {
      "#counter": "counter",
    },
    ExpressionAttributeValues: {
      ":start": 0,
      ":inc": 1,
    },
    ReturnValues: "UPDATED_NEW",
  });

  const response = await docClient.send(command);
  return (response.Attributes?.counter as number) || 1;
}
