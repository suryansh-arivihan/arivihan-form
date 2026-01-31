import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { AuthPayload } from "@/types/auth";
import { MediumOfStudy } from "@/types/form";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "auth_token";
const TOKEN_EXPIRY = "7d";

function getSecretKey(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(JWT_SECRET);
}

export interface SignTokenOptions {
  isTeacher?: boolean;
  teacherName?: string;
  teacherSubjects?: string[];
  teacherLanguages?: MediumOfStudy[];
}

export async function signToken(
  phoneNumber: string,
  options?: SignTokenOptions
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const payload: JWTPayload & Omit<AuthPayload, "exp"> = {
    phoneNumber,
    authenticatedAt: now,
  };

  // Add teacher info if provided
  if (options?.isTeacher) {
    payload.isTeacher = true;
    if (options.teacherName) payload.teacherName = options.teacherName;
    if (options.teacherSubjects)
      payload.teacherSubjects = options.teacherSubjects;
    if (options.teacherLanguages)
      payload.teacherLanguages = options.teacherLanguages;
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecretKey());

  return token;
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    const authPayload: AuthPayload = {
      phoneNumber: payload.phoneNumber as string,
      authenticatedAt: payload.authenticatedAt as number,
      exp: payload.exp as number,
    };

    // Include teacher info if present
    if (payload.isTeacher) {
      authPayload.isTeacher = payload.isTeacher as boolean;
      if (payload.teacherName)
        authPayload.teacherName = payload.teacherName as string;
      if (payload.teacherSubjects)
        authPayload.teacherSubjects = payload.teacherSubjects as string[];
      if (payload.teacherLanguages)
        authPayload.teacherLanguages =
          payload.teacherLanguages as MediumOfStudy[];
    }

    return authPayload;
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  };
}
