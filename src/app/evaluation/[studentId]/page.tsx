"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SUBJECTS } from "@/constants/subjects";
import { StudentRecord, SubjectSubmission, SubmissionType } from "@/types/form";

const PdfAnnotationEditor = dynamic(
  () => import("@/components/pdf-editor/PdfAnnotationEditor"),
  { ssr: false }
);

interface EditorState {
  isOpen: boolean;
  pdfUrl: string;
  subjectCode: string;
  submissionType: SubmissionType;
}

// Icons
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckedDocIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IdCardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
);

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
  const [signingUrl, setSigningUrl] = useState<string | null>(null);

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
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openSignedUrl = async (fileUrl: string) => {
    try {
      setSigningUrl(fileUrl);
      const response = await fetch("/api/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { signedUrl } = await response.json();
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Error opening file:", error);
      alert("Failed to open file. Please try again.");
    } finally {
      setSigningUrl(null);
    }
  };

  const openEditor = (
    pdfUrl: string,
    subjectCode: string,
    submissionType: "arivihan_model_paper" | "own_question_paper"
  ) => {
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

  const handleSaveAnnotatedPdf = async (
    pdfBlob: Blob,
    marks: { obtained: number | null; total: number | null }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", pdfBlob, "answer_sheet_checked.pdf");
      formData.append("studentId", submission?.studentId || "");
      formData.append("subjectCode", editorState.subjectCode);
      formData.append("submissionType", editorState.submissionType);
      if (marks.obtained !== null) {
        formData.append("marksObtained", marks.obtained.toString());
      }
      if (marks.total !== null) {
        formData.append("marksTotal", marks.total.toString());
      }

      const response = await fetch("/api/evaluation/upload-checked", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload PDF");
      }

      const refreshResponse = await fetch(
        `/api/evaluation/submissions/${encodeURIComponent(submission?.studentId || "")}`
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setSubmission(data.submission);
      }

      alert("Checked answer sheet saved successfully!");
      closeEditor();
    } catch (error) {
      alert(`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-5 w-32 skeleton rounded-lg mb-4" />
            <div className="h-8 w-64 skeleton rounded-lg mb-2" />
            <div className="h-4 w-48 skeleton rounded-lg" />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-6">
            <div className="h-6 w-40 skeleton rounded-lg mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 skeleton rounded mb-2" />
                  <div className="h-5 w-32 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
            <div className="h-6 w-48 skeleton rounded-lg mb-4" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 skeleton rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {error || "Submission not found"}
          </h2>
          <p className="text-slate-500 mb-6">The submission you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => router.push("/evaluation")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Subject card component
  const renderSubjectCard = (
    sub: SubjectSubmission,
    submissionType: SubmissionType,
    accentColor: "purple" | "emerald"
  ) => {
    const isChecked = !!sub.checkedAt;
    const colors = {
      purple: {
        badge: "bg-purple-100 text-purple-700",
        border: "border-purple-200",
        bg: "bg-purple-50/50",
      },
      emerald: {
        badge: "bg-emerald-100 text-emerald-700",
        border: "border-emerald-200",
        bg: "bg-emerald-50/50",
      },
    };
    const colorSet = colors[accentColor];

    return (
      <div
        key={sub.subjectCode}
        className={`rounded-xl border p-5 transition-all ${
          isChecked
            ? "border-green-200 bg-green-50/50"
            : `${colorSet.border} ${colorSet.bg}`
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-900">
                {getSubjectName(sub.subjectCode)}
              </h3>
              {isChecked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  <CheckIcon />
                  Checked
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Submitted {formatDate(sub.submittedAt)}
            </p>
            {isChecked && sub.checkedAt && (
              <p className="text-sm text-green-600">
                Checked {formatDate(sub.checkedAt)}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${colorSet.badge}`}>
              {sub.fileType.toUpperCase()}
            </span>
            {isChecked && sub.marksObtained !== undefined && (
              <span className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-100 text-blue-700">
                {sub.marksObtained}
                {sub.marksTotal !== undefined && (
                  <span className="text-blue-500">/{sub.marksTotal}</span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-200/60">
          <div className="flex flex-wrap gap-3">
            {sub.fileUrls.map((url, fileIndex) => (
              <button
                key={fileIndex}
                onClick={() => openSignedUrl(url)}
                disabled={signingUrl === url}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors disabled:opacity-50"
              >
                {signingUrl === url ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <DocumentIcon />
                )}
                {sub.fileUrls.length === 1 ? "View Answer Sheet" : `File ${fileIndex + 1}`}
              </button>
            ))}
            {isChecked && sub.checkedFileUrl && (
              <button
                onClick={() => openSignedUrl(sub.checkedFileUrl!)}
                disabled={signingUrl === sub.checkedFileUrl}
                className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
              >
                {signingUrl === sub.checkedFileUrl ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <CheckedDocIcon />
                )}
                View Checked Paper
              </button>
            )}
          </div>

          {sub.fileUrls.length > 0 && sub.fileUrls[0].endsWith(".pdf") && (
            <button
              onClick={() => openEditor(sub.fileUrls[0], sub.subjectCode, submissionType)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isChecked
                  ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
              }`}
            >
              <PencilIcon />
              {isChecked ? "Re-check" : "Check Paper"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const totalArivihan = submission.arivihanSubjects.length;
  const checkedArivihan = submission.arivihanSubjects.filter(s => s.checkedAt).length;
  const totalOwn = submission.ownSubjects.length;
  const checkedOwn = submission.ownSubjects.filter(s => s.checkedAt).length;

  return (
    <>
      {editorState.isOpen && (
        <PdfAnnotationEditor
          pdfUrl={editorState.pdfUrl}
          onSave={handleSaveAnnotatedPdf}
          onClose={closeEditor}
          subjectName={getSubjectName(editorState.subjectCode)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.push("/evaluation")}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
            >
              <ArrowLeftIcon />
              Back to Dashboard
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {submission.studentName}
                </h1>
                <p className="text-sm text-slate-500 font-mono mt-0.5">{submission.studentId}</p>
              </div>
              <span
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  submission.mediumOfStudy === "hindi"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {submission.mediumOfStudy === "hindi" ? "Hindi Medium" : "English Medium"}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Student Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <PhoneIcon />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Mobile</p>
                  <p className="text-slate-900 font-medium font-mono">{submission.mobileNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <IdCardIcon />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Admit Card</p>
                  {submission.admitCardNumber ? (
                    <p className="text-slate-900 font-medium">{submission.admitCardNumber}</p>
                  ) : submission.admitCardFileUrl ? (
                    <button
                      onClick={() => openSignedUrl(submission.admitCardFileUrl!)}
                      disabled={signingUrl === submission.admitCardFileUrl}
                      className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                    >
                      {signingUrl === submission.admitCardFileUrl ? "Opening..." : "View File"}
                    </button>
                  ) : (
                    <p className="text-slate-400">—</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">First Submitted</p>
                  <p className="text-slate-900">{formatDate(submission.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Last Updated</p>
                  <p className="text-slate-900">{formatDate(submission.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arivihan Model Paper Subjects */}
          {submission.arivihanSubjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Arivihan Model Papers
                  </h2>
                  <p className="text-sm text-slate-500">
                    {totalArivihan} subject{totalArivihan !== 1 ? "s" : ""} submitted
                  </p>
                </div>
                {checkedArivihan > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-green-600">{checkedArivihan}/{totalArivihan}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Checked</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {submission.arivihanSubjects.map((sub) =>
                  renderSubjectCard(sub, "arivihan_model_paper", "purple")
                )}
              </div>
            </div>
          )}

          {/* Own Question Paper Subjects */}
          {submission.ownSubjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Own Question Papers
                  </h2>
                  <p className="text-sm text-slate-500">
                    {totalOwn} subject{totalOwn !== 1 ? "s" : ""} submitted
                  </p>
                </div>
                {checkedOwn > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-green-600">{checkedOwn}/{totalOwn}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Checked</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {submission.ownSubjects.map((sub) =>
                  renderSubjectCard(sub, "own_question_paper", "emerald")
                )}
              </div>
            </div>
          )}

          {/* No submissions */}
          {submission.arivihanSubjects.length === 0 &&
            submission.ownSubjects.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DocumentIcon />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No submissions yet</h3>
                <p className="text-slate-500">This student hasn&apos;t submitted any papers.</p>
              </div>
            )}
        </main>
      </div>
    </>
  );
}
