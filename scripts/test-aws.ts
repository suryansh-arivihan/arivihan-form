import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const region = process.env.AWS_REGION || "us-east-1";
const tableName = process.env.DYNAMODB_TABLE_NAME || "arivihan-form-submissions";
const bucketName = process.env.S3_BUCKET_NAME || "mldatabase";
const folderPrefix = process.env.S3_FOLDER_PREFIX || "arivihan-form-submissions";

async function testDynamoDB() {
  console.log("\n--- Testing DynamoDB ---");
  console.log(`Region: ${region}`);
  console.log(`Table: ${tableName}`);

  const client = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);

    console.log(`✓ DynamoDB table "${tableName}" is accessible`);
    console.log(`  Status: ${response.Table?.TableStatus}`);
    console.log(`  Item count: ${response.Table?.ItemCount}`);

    // Check for GSI
    const gsi = response.Table?.GlobalSecondaryIndexes?.find(
      (idx) => idx.IndexName === "mobile-index"
    );
    if (gsi) {
      console.log(`✓ GSI "mobile-index" exists (Status: ${gsi.IndexStatus})`);
    } else {
      console.log(`✗ GSI "mobile-index" NOT FOUND - duplicate check won't work!`);
    }

    return true;
  } catch (error: any) {
    console.log(`✗ DynamoDB error: ${error.message}`);
    return false;
  }
}

async function testS3() {
  console.log("\n--- Testing S3 ---");
  console.log(`Bucket: ${bucketName}`);
  console.log(`Folder: ${folderPrefix}/`);

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  try {
    // Test listing objects in the folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${folderPrefix}/`,
      MaxKeys: 1,
    });
    await client.send(listCommand);
    console.log(`✓ S3 bucket "${bucketName}" is accessible`);
    console.log(`✓ Can list objects in "${folderPrefix}/" folder`);

    // Test writing a small test file
    const testKey = `${folderPrefix}/.connection-test`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: `Connection test at ${new Date().toISOString()}`,
      ContentType: "text/plain",
    });
    await client.send(putCommand);
    console.log(`✓ Can write to "${folderPrefix}/" folder`);

    return true;
  } catch (error: any) {
    console.log(`✗ S3 error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("=== AWS Connectivity Test ===");

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("✗ AWS credentials not found in .env.local");
    process.exit(1);
  }
  console.log("✓ AWS credentials found");

  const dynamoOk = await testDynamoDB();
  const s3Ok = await testS3();

  console.log("\n=== Summary ===");
  console.log(`DynamoDB: ${dynamoOk ? "✓ OK" : "✗ FAILED"}`);
  console.log(`S3: ${s3Ok ? "✓ OK" : "✗ FAILED"}`);

  if (dynamoOk && s3Ok) {
    console.log("\n All AWS resources are accessible!");
  } else {
    console.log("\n Some resources failed. Please check the errors above.");
    process.exit(1);
  }
}

main();
