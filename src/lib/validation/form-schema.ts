import { z } from "zod";
import { MESSAGES } from "@/constants/messages";

export const studentNameSchema = z
  .string()
  .min(1, MESSAGES.errors.nameRequired)
  .min(2, MESSAGES.errors.nameMinLength)
  .max(100, MESSAGES.errors.nameMaxLength);

export const mobileNumberSchema = z
  .string()
  .min(1, MESSAGES.errors.mobileRequired)
  .regex(/^\d{10}$/, MESSAGES.errors.mobileInvalid);

export const submissionTypeSchema = z.enum(["arivihan_model_paper", "own_question_paper"], {
  errorMap: () => ({ message: MESSAGES.errors.submissionTypeRequired }),
});

export const subjectFileSchema = z.object({
  subjectCode: z.string(),
  fileType: z.enum(["pdf", "images"]),
  fileUrls: z.array(z.string().url()).min(1, MESSAGES.errors.fileRequired),
});

export const formDataSchema = z.object({
  studentName: studentNameSchema,
  mobileNumber: mobileNumberSchema,
  admitCardNumber: z.string().optional(),
  admitCardFileUrl: z.string().url().optional(),
  submissionType: submissionTypeSchema,
  subjects: z.array(subjectFileSchema).min(1, MESSAGES.errors.subjectRequired),
}).refine(
  (data) => data.admitCardNumber || data.admitCardFileUrl,
  {
    message: MESSAGES.errors.admitCardRequired,
    path: ["admitCard"],
  }
);

export type FormDataSchemaType = z.infer<typeof formDataSchema>;

export function validateFormData(data: unknown) {
  return formDataSchema.safeParse(data);
}

export function validateStudentName(name: string) {
  return studentNameSchema.safeParse(name);
}

export function validateMobileNumber(mobile: string) {
  return mobileNumberSchema.safeParse(mobile);
}
