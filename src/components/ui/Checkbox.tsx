"use client";

import React from "react";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
}

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  name,
}: CheckboxProps) {
  return (
    <label
      className={`
        flex items-start gap-3 cursor-pointer group
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-5 h-5 rounded border-2
            transition-all duration-200 flex items-center justify-center
            ${checked
              ? "bg-primary-700 border-primary-700"
              : "border-gray-400 group-hover:border-gray-500 bg-white"
            }
            ${disabled ? "cursor-not-allowed" : ""}
          `}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-text-primary leading-relaxed">{label}</span>
    </label>
  );
}
