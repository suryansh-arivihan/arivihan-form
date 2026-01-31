import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Teacher } from "@/types/teacher";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TEACHERS_TABLE || "arivihan-teachers";

/**
 * Get a teacher by phone number
 */
export async function getTeacherByPhone(
  phoneNumber: string
): Promise<Teacher | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { phoneNumber },
  });

  const response = await docClient.send(command);
  return response.Item ? (response.Item as Teacher) : null;
}

/**
 * Get all active teachers
 */
export async function getAllActiveTeachers(): Promise<Teacher[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "isActive = :active",
    ExpressionAttributeValues: {
      ":active": true,
    },
  });

  const response = await docClient.send(command);
  return (response.Items || []) as Teacher[];
}

/**
 * Update teacher's pending count (increment or decrement)
 */
export async function updateTeacherPendingCount(
  phoneNumber: string,
  delta: number
): Promise<Teacher | null> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { phoneNumber },
    UpdateExpression: "SET pendingCount = pendingCount + :delta",
    ExpressionAttributeValues: {
      ":delta": delta,
    },
    ReturnValues: "ALL_NEW",
  });

  try {
    const response = await docClient.send(command);
    return response.Attributes as Teacher;
  } catch {
    return null;
  }
}

/**
 * Increment teacher's total evaluated count
 */
export async function incrementTeacherEvaluated(
  phoneNumber: string
): Promise<Teacher | null> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { phoneNumber },
    UpdateExpression: "SET totalEvaluated = totalEvaluated + :one",
    ExpressionAttributeValues: {
      ":one": 1,
    },
    ReturnValues: "ALL_NEW",
  });

  try {
    const response = await docClient.send(command);
    return response.Attributes as Teacher;
  } catch {
    return null;
  }
}

/**
 * Set teacher active/inactive status
 */
export async function setTeacherActiveStatus(
  phoneNumber: string,
  isActive: boolean
): Promise<Teacher | null> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { phoneNumber },
    UpdateExpression: "SET isActive = :active",
    ExpressionAttributeValues: {
      ":active": isActive,
    },
    ReturnValues: "ALL_NEW",
  });

  try {
    const response = await docClient.send(command);
    return response.Attributes as Teacher;
  } catch {
    return null;
  }
}
