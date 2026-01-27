import React from "react";
import { MESSAGES } from "@/constants/messages";

export default function FormInstructions() {
  return (
    <div className="bg-white rounded-b-lg shadow-form p-6 mb-4">
      <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">
        {MESSAGES.formTitle}
      </h2>
      <div className="text-sm text-text-primary font-medium whitespace-pre-line leading-relaxed">
        {MESSAGES.globalInstructions}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-text-error">
          * अनिवार्य प्रश्न / Required questions
        </p>
      </div>
    </div>
  );
}
