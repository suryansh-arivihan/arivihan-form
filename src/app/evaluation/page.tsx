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
}

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
  });

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

    // Search filter (name or mobile)
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(searchLower) ||
          s.mobileNumber.includes(filters.search)
      );
    }

    // Submission type filter
    if (filters.submissionType !== "all") {
      result = result.filter((s) => {
        if (filters.submissionType === "arivihan") {
          return s.arivihanSubjects.length > 0;
        } else {
          return s.ownSubjects.length > 0;
        }
      });
    }

    // Subject filter
    if (filters.subject !== "all") {
      result = result.filter((s) => {
        const allSubjects = [
          ...s.arivihanSubjects.map((sub) => sub.subjectCode),
          ...s.ownSubjects.map((sub) => sub.subjectCode),
        ];
        return allSubjects.includes(filters.subject);
      });
    }

    setFilteredSubmissions(result);
  }, [submissions, filters]);

  const getSubjectName = (code: string) => {
    const subject = SUBJECTS.find((s) => s.code === code);
    return subject ? subject.nameEn : code;
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

  const getTotalSubjects = (record: StudentRecord) => {
    return record.arivihanSubjects.length + record.ownSubjects.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-form-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-form-bg flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-form max-w-md">
          <h2 className="text-xl font-medium text-text-error mb-2">Error</h2>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={() => fetchSubmissions()}
            className="mt-4 px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-form-bg">
      {/* Header */}
      <header className="bg-white shadow-form sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-medium text-primary-700">
            Evaluation Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredSubmissions.length} of {submissions.length} submissions
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-form p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Name or Mobile..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                className="w-full px-3 py-2 border border-form-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Submission Type */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Submission Type
              </label>
              <select
                value={filters.submissionType}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    submissionType: e.target.value as Filters["submissionType"],
                  }))
                }
                className="w-full px-3 py-2 border border-form-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="arivihan">Arivihan Model Paper</option>
                <option value="own">Own Question Paper</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, subject: e.target.value }))
                }
                className="w-full px-3 py-2 border border-form-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-form overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">
                    Medium
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">
                    Arivihan Subjects
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">
                    Own Subjects
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-form-border">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-text-secondary"
                    >
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((record) => (
                    <tr
                      key={record.studentId}
                      onClick={() => router.push(`/evaluation/${encodeURIComponent(record.studentId)}`)}
                      className="hover:bg-primary-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">
                          {record.studentName}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {record.studentId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {record.mobileNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            record.mediumOfStudy === "hindi"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {record.mediumOfStudy === "hindi" ? "Hindi" : "English"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {record.arivihanSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.arivihanSubjects.map((sub) => (
                              <span
                                key={sub.subjectCode}
                                className="inline-flex px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded"
                              >
                                {getSubjectName(sub.subjectCode)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-secondary text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.ownSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.ownSubjects.map((sub) => (
                              <span
                                key={sub.subjectCode}
                                className="inline-flex px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded"
                              >
                                {getSubjectName(sub.subjectCode)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-secondary text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(record.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {nextKey && (
            <div className="px-4 py-3 border-t border-form-border bg-gray-50">
              <button
                onClick={() => fetchSubmissions(nextKey)}
                disabled={loadingMore}
                className="w-full py-2 text-primary-700 hover:text-primary-800 font-medium disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
