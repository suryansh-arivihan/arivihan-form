"use client";

import React from "react";
import FormCard from "@/components/ui/FormCard";
import { MESSAGES } from "@/constants/messages";
import { SubmissionType } from "@/types/form";

interface SubmissionTypeSectionProps {
  value: SubmissionType | null;
  onChange: (value: SubmissionType) => void;
  error?: string;
  disabled?: boolean;
  arivihanRemaining?: number;
  ownRemaining?: number;
  showQuota?: boolean;
}

export default function SubmissionTypeSection({
  value,
  onChange,
  error,
  disabled = false,
  arivihanRemaining = 3,
  ownRemaining = 1,
  showQuota = false,
}: SubmissionTypeSectionProps) {
  const isArivihanExhausted = arivihanRemaining === 0;
  const isOwnExhausted = ownRemaining === 0;

  return (
    <FormCard hasTopBorder>
      <h3 className="text-base font-medium text-text-primary mb-1">
        {MESSAGES.submissionTypeSection}
        <span className="text-text-error ml-1">*</span>
      </h3>

      <div className="mt-4 space-y-3">
        {/* Arivihan Model Paper Option */}
        <label
          className={`
            flex items-start gap-3 cursor-pointer group
            ${disabled || isArivihanExhausted ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="radio"
              name="submissionType"
              value="arivihan_model_paper"
              checked={value === "arivihan_model_paper"}
              onChange={() => onChange("arivihan_model_paper")}
              disabled={disabled || isArivihanExhausted}
              className="sr-only peer"
            />
            <div
              className={`
                w-5 h-5 rounded-full border-2
                transition-all duration-200
                ${value === "arivihan_model_paper"
                  ? "border-primary-700"
                  : "border-gray-400 group-hover:border-gray-500"
                }
              `}
            >
              {value === "arivihan_model_paper" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-700" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm text-text-primary leading-relaxed">
              {MESSAGES.arivihan_model_paper}
            </span>
            {showQuota && (
              <span className={`ml-2 text-xs ${isArivihanExhausted ? "text-text-error" : "text-text-secondary"}`}>
                ({arivihanRemaining}/3 शेष)
              </span>
            )}
            {isArivihanExhausted && (
              <p className="text-xs text-text-error mt-1">
                सीमा समाप्त / Quota exhausted
              </p>
            )}
          </div>
        </label>

        {/* Own Question Paper Option */}
        <label
          className={`
            flex items-start gap-3 cursor-pointer group
            ${disabled || isOwnExhausted ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="radio"
              name="submissionType"
              value="own_question_paper"
              checked={value === "own_question_paper"}
              onChange={() => onChange("own_question_paper")}
              disabled={disabled || isOwnExhausted}
              className="sr-only peer"
            />
            <div
              className={`
                w-5 h-5 rounded-full border-2
                transition-all duration-200
                ${value === "own_question_paper"
                  ? "border-primary-700"
                  : "border-gray-400 group-hover:border-gray-500"
                }
              `}
            >
              {value === "own_question_paper" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-700" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm text-text-primary leading-relaxed">
              {MESSAGES.own_question_paper}
            </span>
            {showQuota && (
              <span className={`ml-2 text-xs ${isOwnExhausted ? "text-text-error" : "text-text-secondary"}`}>
                ({ownRemaining}/1 शेष)
              </span>
            )}
            {isOwnExhausted && (
              <p className="text-xs text-text-error mt-1">
                सीमा समाप्त / Quota exhausted
              </p>
            )}
          </div>
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm text-text-error">{error}</p>
      )}
    </FormCard>
  );
}
