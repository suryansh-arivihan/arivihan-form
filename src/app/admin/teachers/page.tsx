"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS } from "@/constants/subjects";

interface Teacher {
  phoneNumber: string;
  name: string;
  languages: ("hindi" | "english")[];
  subjects: string[];
  isActive: boolean;
  pendingCount: number;
  totalEvaluated: number;
  onboardedAt: string;
}

interface FormData {
  phoneNumber: string;
  name: string;
  languages: ("hindi" | "english")[];
  subjects: string[];
}

const initialFormData: FormData = {
  phoneNumber: "",
  name: "",
  languages: [],
  subjects: [],
};

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function AdminTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/teachers");

      if (response.status === 403) {
        router.push("/login?redirect=/admin/teachers");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }

      const data = await response.json();
      setTeachers(data.teachers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData(initialFormData);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      phoneNumber: teacher.phoneNumber,
      name: teacher.name,
      languages: [...teacher.languages],
      subjects: [...teacher.subjects],
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingTeacher
        ? `/api/admin/teachers/${editingTeacher.phoneNumber}`
        : "/api/admin/teachers";

      const method = editingTeacher ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save teacher");
      }

      closeModal();
      fetchTeachers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (phoneNumber: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/teachers/${phoneNumber}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete teacher");
      }

      setDeleteConfirm(null);
      fetchTeachers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (teacher: Teacher) => {
    try {
      const response = await fetch(`/api/admin/teachers/${teacher.phoneNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !teacher.isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      fetchTeachers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const toggleLanguage = (lang: "hindi" | "english") => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const toggleSubject = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(code)
        ? prev.subjects.filter((s) => s !== code)
        : [...prev.subjects, code],
    }));
  };

  const getSubjectName = (code: string) => {
    const subject = SUBJECTS.find((s) => s.code === code);
    return subject ? subject.nameEn : code;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center">
        <LoaderIcon />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => fetchTeachers()}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/evaluation")}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Manage Teachers</h1>
                <p className="text-sm text-slate-500">{teachers.length} teachers</p>
              </div>
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              <PlusIcon />
              <span className="hidden sm:inline">Add Teacher</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Teachers Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.phoneNumber}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                teacher.isActive ? "border-slate-200/60" : "border-red-200 bg-red-50/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{teacher.phoneNumber}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(teacher)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(teacher.phoneNumber)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Languages */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Languages</p>
                  <div className="flex gap-1.5">
                    {teacher.languages.map((lang) => (
                      <span
                        key={lang}
                        className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                          lang === "hindi"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {lang === "hindi" ? "Hindi" : "English"}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-md"
                      >
                        {getSubjectName(code)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-lg font-semibold text-amber-600">{teacher.pendingCount}</p>
                    <p className="text-xs text-slate-400">Pending</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-600">{teacher.totalEvaluated}</p>
                    <p className="text-xs text-slate-400">Evaluated</p>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => toggleActive(teacher)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        teacher.isActive
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {teacher.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {teachers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500">No teachers added yet</p>
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-colors"
              >
                <PlusIcon />
                Add your first teacher
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTeacher ? "Edit Teacher" : "Add Teacher"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {formError}
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                  }
                  disabled={!!editingTeacher}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Sharma"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Languages
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLanguage("hindi")}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                      formData.languages.includes("hindi")
                        ? "bg-amber-100 text-amber-700 ring-2 ring-amber-500"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Hindi
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLanguage("english")}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                      formData.languages.includes("english")
                        ? "bg-sky-100 text-sky-700 ring-2 ring-sky-500"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subjects
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject.code}
                      type="button"
                      onClick={() => toggleSubject(subject.code)}
                      className={`px-3 py-2 text-sm rounded-xl font-medium transition-all text-left ${
                        formData.subjects.includes(subject.code)
                          ? "bg-purple-100 text-purple-700 ring-2 ring-purple-500"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {subject.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.languages.length === 0 || formData.subjects.length === 0}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <LoaderIcon />}
                  {editingTeacher ? "Save Changes" : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Teacher?</h3>
            <p className="text-slate-500 mb-6">
              This will permanently remove this teacher from the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <LoaderIcon />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
