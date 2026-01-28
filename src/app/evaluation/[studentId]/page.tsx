"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SUBJECTS } from "@/constants/subjects";

// Dynamically import PDF editor to avoid SSR issues
const PdfAnnotationEditor = dynamic(
  () => import("@/components/pdf-editor/PdfAnnotationEditor"),
  { ssr: false }
);

interface SubjectSubmission {
  subjectCode: string;
  fileType: "pdf" | "images";
  fileUrls: string[];
  submittedAt: string;
}

interface StudentRecord {
  studentId: string;
  studentName: string;
  mobileNumber: string;
  mediumOfStudy: "hindi" | "english";
  admitCardNumber?: string;
  admitCardFileUrl?: string;
  arivihanSubjects: SubjectSubmission[];
  ownSubjects: SubjectSubmission[];
  createdAt: string;
  updatedAt: string;
}

interface EditorState {
  isOpen: boolean;
  pdfUrl: string;
  subjectCode: string;
  submissionType: "arivihan_model_paper" | "own_question_paper";
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [submission, setSubmission] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    isOpen: false,
    pdfUrl: "",
    subjectCode: "",
    submissionType: "arivihan_model_paper",
  });

  useEffect(() => {
    async function fetchSubmission() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/evaluation/submissions/${encodeURIComponent(studentId)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Submission not found");
          }
          throw new Error("Failed to fetch submission");
        }

        const data = await response.json();
        setSubmission(data.submission);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchSubmission();
    }
  }, [studentId]);

  const getSubjectName = (code: string) => {
    const subject = SUBJECTS.find((s) => s.code === code);
    return subject ? `${subject.nameEn} (${subject.nameHi})` : code;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openEditor = (
    pdfUrl: string,
    subjectCode: string,
    submissionType: "arivihan_model_paper" | "own_question_paper"
  ) => {
    // Use proxy URL to avoid CORS issues with S3
    const proxyUrl = `/api/evaluation/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
    setEditorState({
      isOpen: true,
      pdfUrl: proxyUrl,
      subjectCode,
      submissionType,
    });
  };

  const closeEditor = () => {
    setEditorState({
      isOpen: false,
      pdfUrl: "",
      subjectCode: "",
      submissionType: "arivihan_model_paper",
    });
  };

  const handleSaveAnnotatedPdf = async (pdfBlob: Blob) => {
    try {
      // Create FormData and upload through our API (avoids CORS issues)
      const formData = new FormData();
      formData.append("file", pdfBlob, "answer_sheet_checked.pdf");
      formData.append("studentId", submission?.studentId || "");
      formData.append("subjectCode", editorState.subjectCode);
      formData.append("submissionType", editorState.submissionType);

      const response = await fetch("/api/evaluation/upload-checked", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        throw new Error(errorData.error || "Failed to upload PDF");
      }

      const { fileUrl } = await response.json();
      console.log("Upload successful! File URL:", fileUrl);
      alert("Checked answer sheet saved successfully!");
      closeEditor();
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert(`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-form-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-form-bg flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-form max-w-md text-center">
          <h2 className="text-xl font-medium text-text-error mb-2">
            {error || "Submission not found"}
          </h2>
          <button
            onClick={() => router.push("/evaluation")}
            className="mt-4 px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render subject card with check button
  const renderSubjectCard = (
    sub: SubjectSubmission,
    submissionType: "arivihan_model_paper" | "own_question_paper",
    colorClass: { bg: string; text: string }
  ) => (
    <div
      key={sub.subjectCode}
      className="border border-form-border rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-text-primary">
            {getSubjectName(sub.subjectCode)}
          </h3>
          <p className="text-xs text-text-secondary">
            Submitted: {formatDate(sub.submittedAt)}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${colorClass.bg} ${colorClass.text}`}>
          {sub.fileType.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {sub.fileUrls.map((url, fileIndex) => (
            <a
              key={fileIndex}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary-700 hover:text-primary-800 hover:underline text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {sub.fileUrls.length === 1
                ? "View Answer Sheet"
                : `View File ${fileIndex + 1}`}
            </a>
          ))}
        </div>

        {/* Check Button - only for PDFs */}
        {sub.fileUrls.length > 0 && sub.fileUrls[0].endsWith(".pdf") && (
          <button
            onClick={() =>
              openEditor(sub.fileUrls[0], sub.subjectCode, submissionType)
            }
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Check Paper
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* PDF Editor Modal */}
      {editorState.isOpen && (
        <PdfAnnotationEditor
          pdfUrl={editorState.pdfUrl}
          onSave={handleSaveAnnotatedPdf}
          onClose={closeEditor}
        />
      )}

      <div className="min-h-screen bg-form-bg">
        {/* Header */}
        <header className="bg-white shadow-form sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => router.push("/evaluation")}
              className="flex items-center text-primary-700 hover:text-primary-800 mb-2"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-medium text-primary-700">
              {submission.studentName}
            </h1>
            <p className="text-sm text-text-secondary">{submission.studentId}</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-lg shadow-form p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">
              Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Name</p>
                <p className="text-text-primary font-medium">
                  {submission.studentName}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Mobile Number</p>
                <p className="text-text-primary font-medium">
                  {submission.mobileNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Medium of Study</p>
                <span
                  className={`inline-flex px-2 py-1 text-sm rounded-full ${
                    submission.mediumOfStudy === "hindi"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {submission.mediumOfStudy === "hindi" ? "Hindi" : "English"}
                </span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Admit Card</p>
                {submission.admitCardNumber ? (
                  <p className="text-text-primary font-medium">
                    {submission.admitCardNumber}
                  </p>
                ) : submission.admitCardFileUrl ? (
                  <a
                    href={submission.admitCardFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-700 hover:underline"
                  >
                    View Admit Card
                  </a>
                ) : (
                  <p className="text-text-secondary">-</p>
                )}
              </div>
              <div>
                <p className="text-sm text-text-secondary">First Submitted</p>
                <p className="text-text-primary">
                  {formatDate(submission.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Last Updated</p>
                <p className="text-text-primary">
                  {formatDate(submission.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Arivihan Model Paper Subjects */}
          {submission.arivihanSubjects.length > 0 && (
            <div className="bg-white rounded-lg shadow-form p-6">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                Arivihan Model Paper Submissions
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({submission.arivihanSubjects.length}/3 subjects)
                </span>
              </h2>
              <div className="space-y-4">
                {submission.arivihanSubjects.map((sub) =>
                  renderSubjectCard(sub, "arivihan_model_paper", {
                    bg: "bg-primary-100",
                    text: "text-primary-800",
                  })
                )}
              </div>
            </div>
          )}

          {/* Own Question Paper Subjects */}
          {submission.ownSubjects.length > 0 && (
            <div className="bg-white rounded-lg shadow-form p-6">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                Own Question Paper Submissions
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({submission.ownSubjects.length}/1 subject)
                </span>
              </h2>
              <div className="space-y-4">
                {submission.ownSubjects.map((sub) =>
                  renderSubjectCard(sub, "own_question_paper", {
                    bg: "bg-green-100",
                    text: "text-green-800",
                  })
                )}
              </div>
            </div>
          )}

          {/* No submissions */}
          {submission.arivihanSubjects.length === 0 &&
            submission.ownSubjects.length === 0 && (
              <div className="bg-white rounded-lg shadow-form p-8 text-center">
                <p className="text-text-secondary">No subject submissions yet.</p>
              </div>
            )}
        </main>
      </div>
    </>
  );
}
