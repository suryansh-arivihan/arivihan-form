"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Step = "phone" | "otp";

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/evaluation";

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep("otp");
      setResendTimer(30);
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newOtp.every((digit) => digit !== "")) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      otpInputRefs.current[focusIndex]?.focus();

      // Auto-submit if complete
      if (newOtp.every((digit) => digit !== "")) {
        handleOtpSubmit(newOtp.join(""));
      }
    }
  };

  const handleOtpSubmit = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join("");
    setError(null);

    if (otpToVerify.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp: otpToVerify }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Invalid OTP");
      }

      // Redirect to the original destination or evaluation dashboard
      // Use window.location for a full page reload to ensure cookie is sent
      window.location.href = redirectPath;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <ShieldIcon />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Evaluation Portal</h1>
          <p className="text-slate-500 mt-1">Sign in to access the evaluation dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setPhoneNumber(value);
                      setError(null);
                    }}
                    placeholder="Enter your 10-digit number"
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phoneNumber.length !== 10}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoaderIcon />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <PhoneIcon />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div>
              {/* Back button */}
              <button
                onClick={goBack}
                disabled={loading}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
              >
                <ArrowLeftIcon />
                <span>Change number</span>
              </button>

              <div className="text-center mb-6">
                <p className="text-slate-600">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-semibold text-slate-900">+91 {phoneNumber}</p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-xl font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              <button
                onClick={() => handleOtpSubmit()}
                disabled={loading || otp.some((digit) => digit === "")}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoaderIcon />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify OTP</span>
                )}
              </button>

              {/* Resend OTP */}
              <div className="mt-4 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-slate-500">
                    Resend OTP in <span className="font-medium">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6">
          This portal is for authorized evaluators only
        </p>
      </div>
    </div>
  );
}
