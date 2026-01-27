"use client";

import React from "react";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function RadioGroup({
  name,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: RadioGroupProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            flex items-start gap-3 cursor-pointer group
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div
              className={`
                w-5 h-5 rounded-full border-2
                transition-all duration-200
                ${value === option.value
                  ? "border-primary-700"
                  : "border-gray-400 group-hover:border-gray-500"
                }
              `}
            >
              {value === option.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-700" />
                </div>
              )}
            </div>
          </div>
          <span className="text-sm text-text-primary leading-relaxed">
            {option.label}
          </span>
        </label>
      ))}
      {error && (
        <p className="mt-2 text-sm text-text-error">{error}</p>
      )}
    </div>
  );
}
