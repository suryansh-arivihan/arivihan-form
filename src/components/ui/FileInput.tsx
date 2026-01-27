"use client";

import React, { useRef } from "react";

interface FileInputProps {
  label: string;
  accept: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  error?: string;
  disabled?: boolean;
  hint?: string;
}

export default function FileInput({
  label,
  accept,
  multiple = false,
  onChange,
  error,
  disabled = false,
  hint,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5
          text-sm font-medium
          border rounded-md
          transition-all duration-200
          ${disabled
            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            : "bg-white text-primary-700 border-primary-300 hover:bg-primary-50 hover:border-primary-400"
          }
        `}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {label}
      </button>
      {hint && (
        <p className="mt-2 text-xs text-text-secondary">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-text-error">{error}</p>
      )}
    </div>
  );
}
