"use client";

import React from "react";

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "text" | "tel";
  required?: boolean;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function TextInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  required = false,
  error,
  maxLength,
  disabled = false,
}: TextInputProps) {
  const inputId = `input-${name}`;

  return (
    <div className="mb-6">
      <label htmlFor={inputId} className="block text-sm text-text-primary mb-2">
        {label}
        {required && <span className="text-text-error ml-1">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full px-0 py-2
          text-text-primary text-base
          bg-transparent
          border-0 border-b-2
          focus:outline-none focus:ring-0
          transition-colors duration-200
          placeholder:text-text-secondary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? "border-text-error focus:border-text-error"
            : "border-gray-300 focus:border-primary-700"
          }
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-text-error">{error}</p>
      )}
    </div>
  );
}
