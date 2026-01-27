import { Subject } from "@/types/form";

export const SUBJECTS: Subject[] = [
  { code: "hindi", nameEn: "Hindi", nameHi: "हिन्दी" },
  { code: "english", nameEn: "English", nameHi: "अंग्रेज़ी" },
  { code: "physics", nameEn: "Physics", nameHi: "भौतिक विज्ञान" },
  { code: "chemistry", nameEn: "Chemistry", nameHi: "रसायन विज्ञान" },
  { code: "biology", nameEn: "Biology", nameHi: "जीव विज्ञान" },
  { code: "mathematics", nameEn: "Mathematics", nameHi: "गणित" },
  { code: "history", nameEn: "History", nameHi: "इतिहास" },
  { code: "political_science", nameEn: "Political Science", nameHi: "राजनीति विज्ञान" },
  { code: "economics", nameEn: "Economics", nameHi: "अर्थशास्त्र" },
  { code: "geography", nameEn: "Geography", nameHi: "भूगोल" },
  { code: "sociology", nameEn: "Sociology", nameHi: "समाजशास्त्र" },
  { code: "business_studies", nameEn: "Business Studies", nameHi: "व्यवसाय अध्ययन" },
  { code: "accountancy", nameEn: "Accountancy", nameHi: "लेखाशास्त्र" },
];

export const MAX_SUBJECTS_ARIVIHAN = 3;
export const MAX_SUBJECTS_OWN = 1;

export const MAX_PDF_SIZE_MB = 100;
export const MAX_IMAGE_SIZE_MB = 25;
export const MAX_IMAGES_PER_SUBJECT = 10;
export const MAX_ADMIT_CARD_SIZE_MB = 25;

export const ACCEPTED_FILE_TYPES = {
  pdf: {
    accept: ".pdf",
    mimeTypes: ["application/pdf"],
  },
  images: {
    accept: ".jpg,.jpeg,.png",
    mimeTypes: ["image/jpeg", "image/png"],
  },
  admitCard: {
    accept: ".jpg,.jpeg,.png,.pdf",
    mimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  },
};

export function getSubjectByCode(code: string): Subject | undefined {
  return SUBJECTS.find((s) => s.code === code);
}
