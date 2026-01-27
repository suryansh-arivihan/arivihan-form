/**
 * Sanitize student name for use in folder paths
 * - Removes special characters
 * - Replaces spaces with underscores
 * - Converts to lowercase
 */
export function sanitizeForPath(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "") // Remove special chars (keeps Hindi chars out, uses phone for uniqueness)
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 50); // Limit length
}

/**
 * Generate the student folder name from name and phone
 * Format: {SanitizedName}_{PhoneNumber}
 */
export function generateStudentFolder(studentName: string, mobileNumber: string): string {
  const sanitizedName = sanitizeForPath(studentName);
  return `${sanitizedName}_${mobileNumber}`;
}

/**
 * Generate path for admit card
 * Format: {StudentFolder}/admit-card/admit_card_{timestamp}.{ext}
 */
export function generateAdmitCardPath(
  studentName: string,
  mobileNumber: string,
  fileName: string
): string {
  const studentFolder = generateStudentFolder(studentName, mobileNumber);
  const timestamp = Date.now();
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  return `${studentFolder}/admit-card/admit_card_${timestamp}.${extension}`;
}

/**
 * Generate path for answer sheet
 * Format: {StudentFolder}/{submission-type}/{subject-code}/page_{index}.{ext}
 * or: {StudentFolder}/{submission-type}/{subject-code}/answer_sheet.{ext} for PDF
 */
export function generateAnswerSheetPath(
  studentName: string,
  mobileNumber: string,
  submissionType: "arivihan_model_paper" | "own_question_paper",
  subjectCode: string,
  fileName: string,
  imageIndex?: number
): string {
  const studentFolder = generateStudentFolder(studentName, mobileNumber);
  const submissionFolder = submissionType === "arivihan_model_paper"
    ? "arivihan-model-paper"
    : "own-question-paper";
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";

  if (imageIndex !== undefined) {
    const paddedIndex = String(imageIndex + 1).padStart(2, "0");
    return `${studentFolder}/${submissionFolder}/${subjectCode}/page_${paddedIndex}.${extension}`;
  }

  // For PDF files
  return `${studentFolder}/${submissionFolder}/${subjectCode}/answer_sheet.${extension}`;
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function isImageFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ["jpg", "jpeg", "png"].includes(ext);
}

export function isPdfFile(fileName: string): boolean {
  return getFileExtension(fileName) === "pdf";
}

export function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
