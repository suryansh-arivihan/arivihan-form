export function generateAdmitCardPath(submissionId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop()?.toLowerCase() || "pdf";
  return `admit-cards/${submissionId}/admit_card_${timestamp}.${extension}`;
}

export function generateAnswerSheetPath(
  submissionId: string,
  subjectCode: string,
  fileName: string,
  imageIndex?: number
): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop()?.toLowerCase() || "pdf";

  if (imageIndex !== undefined) {
    const paddedIndex = String(imageIndex + 1).padStart(2, "0");
    return `answer-sheets/${submissionId}/${subjectCode}/${subjectCode}_${timestamp}_${paddedIndex}.${extension}`;
  }

  return `answer-sheets/${submissionId}/${subjectCode}/${subjectCode}_${timestamp}.${extension}`;
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
