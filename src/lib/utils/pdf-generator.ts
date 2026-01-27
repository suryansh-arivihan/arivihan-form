import { PDFDocument } from "pdf-lib";

/**
 * Converts an array of image files to a single PDF document.
 * Each image becomes one page in the PDF, with page dimensions matching the image.
 *
 * @param imageFiles - Array of image File objects (JPEG or PNG)
 * @returns Promise<Blob> - PDF blob ready for upload
 */
export async function imagesToPdf(imageFiles: File[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const file of imageFiles) {
    const imageBytes = await file.arrayBuffer();
    let image;

    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === "image/png") {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      console.warn(`Skipping unsupported image type: ${file.type}`);
      continue;
    }

    // Create page with same dimensions as image
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

/**
 * Checks if all files in the array are images (JPEG or PNG)
 */
export function areAllImages(files: File[]): boolean {
  return files.every(
    (file) =>
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/png"
  );
}
