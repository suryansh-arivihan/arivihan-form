import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth_token";
const LOGIN_PATH = "/login";

// Paths that require authentication
const PROTECTED_PAGE_PATHS = ["/evaluation", "/admin"];
const PROTECTED_API_PATHS = ["/api/evaluation", "/api/admin"];

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  console.log("[Middleware] Checking auth, cookie present:", !!token);

  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, getSecretKey());
    console.log("[Middleware] JWT verified successfully");
    return true;
  } catch (error) {
    console.log("[Middleware] JWT verification failed:", error);
    return false;
  }
}

function isProtectedPagePath(pathname: string): boolean {
  for (const protectedPath of PROTECTED_PAGE_PATHS) {
    if (pathname === protectedPath || pathname.startsWith(protectedPath + "/")) {
      return true;
    }
  }

  return false;
}

function isProtectedApiPath(pathname: string): boolean {
  for (const protectedPath of PROTECTED_API_PATHS) {
    if (pathname === protectedPath || pathname.startsWith(protectedPath + "/")) {
      return true;
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires authentication
  const isPageProtected = isProtectedPagePath(pathname);
  const isApiProtected = isProtectedApiPath(pathname);

  if (!isPageProtected && !isApiProtected) {
    return NextResponse.next();
  }

  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    if (isApiProtected) {
      // Return 401 for API routes
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Redirect to login for page routes
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/evaluation/:path*",
    "/api/evaluation/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
