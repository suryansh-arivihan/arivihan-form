"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS } from "@/constants/subjects";

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

interface Filters {
  search: string;
  submissionType: "all" | "arivihan" | "own";
  subject: string;
  medium: "all" | "hindi" | "english";
}

const ITEMS_PER_PAGE = 15;

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const DoubleChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const DoubleChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function EvaluationPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<StudentRecord[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextKey, setNextKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    submissionType: "all",
    subject: "all",
    medium: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSubmissions = useCallback(async (lastKey?: string | null) => {
    try {
      const isLoadingMore = !!lastKey;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({ limit: "50" });
      if (lastKey) {
        params.append("lastKey", lastKey);
      }

      const response = await fetch(`/api/evaluation/submissions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();

      if (isLoadingMore) {
        setSubmissions((prev) => [...prev, ...data.submissions]);
      } else {
        setSubmissions(data.submissions);
      }

      setNextKey(data.nextKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Apply filters
  useEffect(() => {
    let result = [...submissions];

    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(searchLower) ||
          s.mobileNumber.includes(filters.search)
      );
    }

    if (filters.submissionType !== "all") {
      result = result.filter((s) => {
        if (filters.submissionType === "arivihan") {
          return s.arivihanSubjects.length > 0;
        } else {
          return s.ownSubjects.length > 0;
        }
      });
    }

    if (filters.subject !== "all") {
      result = result.filter((s) => {
        const allSubjects = [
          ...s.arivihanSubjects.map((sub) => sub.subjectCode),
          ...s.ownSubjects.map((sub) => sub.subjectCode),
        ];
        return allSubjects.includes(filters.subject);
      });
    }

    // Medium filter
    if (filters.medium !== "all") {
      result = result.filter((s) => s.mediumOfStudy === filters.medium);
    }

    setFilteredSubmissions(result);
    setCurrentPage(1);
  }, [submissions, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getSubjectName = (code: string) => {
    const subject = SUBJECTS.find((s) => s.code === code);
    return subject ? subject.nameEn : code;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 w-64 skeleton rounded-lg mb-2" />
            <div className="h-4 w-48 skeleton rounded-lg" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 skeleton rounded-xl" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="h-12 skeleton" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 skeleton border-t border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => fetchSubmissions()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                Evaluation Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                {filteredSubmissions.length > 0
                  ? `${filteredSubmissions.length} submission${filteredSubmissions.length !== 1 ? "s" : ""}`
                  : "No submissions"}
                {filteredSubmissions.length !== submissions.length && (
                  <span className="text-slate-400"> · filtered from {submissions.length}</span>
                )}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-900">{submissions.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-right">
                <p className="text-2xl font-semibold text-purple-600">
                  {submissions.filter((s) => s.arivihanSubjects.length > 0).length}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Arivihan</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by name or mobile..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all"
              />
            </div>

            {/* Submission Type */}
            <div className="relative">
              <select
                value={filters.submissionType}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    submissionType: e.target.value as Filters["submissionType"],
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="arivihan">Arivihan Model Paper</option>
                <option value="own">Own Question Paper</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Subject */}
            <div className="relative">
              <select
                value={filters.subject}
                onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.nameEn}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Medium */}
            <div className="relative">
              <select
                value={filters.medium}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    medium: e.target.value as Filters["medium"],
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Mediums</option>
                <option value="hindi">Hindi Medium</option>
                <option value="english">English Medium</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Medium
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Arivihan Subjects
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Own Subjects
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                          <DocumentIcon />
                        </div>
                        <p className="text-slate-900 font-medium">No submissions found</p>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((record, index) => (
                    <tr
                      key={record.studentId}
                      onClick={() => router.push(`/evaluation/${encodeURIComponent(record.studentId)}`)}
                      className="group hover:bg-purple-50/50 transition-colors cursor-pointer animate-slide-up"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 group-hover:text-purple-700 transition-colors">
                          {record.studentName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {record.studentId.slice(0, 12)}...
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">{record.mobileNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg ${
                            record.mediumOfStudy === "hindi"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {record.mediumOfStudy === "hindi" ? "Hindi" : "English"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.arivihanSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {record.arivihanSubjects.slice(0, 2).map((sub) => (
                              <span
                                key={sub.subjectCode}
                                className="inline-flex px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-md"
                              >
                                {getSubjectName(sub.subjectCode)}
                              </span>
                            ))}
                            {record.arivihanSubjects.length > 2 && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                                +{record.arivihanSubjects.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.ownSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {record.ownSubjects.slice(0, 2).map((sub) => (
                              <span
                                key={sub.subjectCode}
                                className="inline-flex px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md"
                              >
                                {getSubjectName(sub.subjectCode)}
                              </span>
                            ))}
                            {record.ownSubjects.length > 2 && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                                +{record.ownSubjects.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{formatDate(record.updatedAt)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(endIndex, filteredSubmissions.length)}
                </span>{" "}
                of <span className="font-medium text-slate-700">{filteredSubmissions.length}</span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="First page"
                >
                  <DoubleChevronLeftIcon />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon />
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((page, idx) =>
                    typeof page === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                        {page}
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRightIcon />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Last page"
                >
                  <DoubleChevronRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* Load More */}
          {nextKey && (
            <div className="px-6 py-4 border-t border-slate-100 bg-purple-50/50">
              <button
                onClick={() => fetchSubmissions(nextKey)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl border border-purple-200 text-purple-600 hover:bg-purple-100 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <LoaderIcon />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <>
                    <span>Load more submissions</span>
                    <span className="text-purple-400">({submissions.length} loaded)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
